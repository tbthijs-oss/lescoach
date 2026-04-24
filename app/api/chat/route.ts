import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { searchKenniskaarten, matchExperts } from "@/lib/airtable";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { filterPiiFromMessages, summarizeDetections } from "@/lib/pii";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar, getSchool } from "@/lib/authDb";
import { logGesprek } from "@/lib/gesprekkenDb";
import { logMeldcodeSignaal } from "@/lib/meldcodeDb";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface NoorAnalysis {
  profileLine: string;
  primaryKaartTitel: string;
  alternativeKaartTitels: string[];
  insight: string;
  acties: string[];
  overleg: string;
  signaal: string;
  contextChips: string[];
}

function parseSuggestions(text: string): { message: string; suggestions: string[] } {
  // Be forgiving: accept "Suggesties" / "Suggestions", optional spaces, and
  // both "|" and "/" as separators (models occasionally substitute).
  const match = text.match(/\[(?:suggesties|suggestions)\s*:\s*([^\]]+)\]/i);
  if (!match) return { message: text, suggestions: [] };
  const rawList = match[1];
  // Prefer | as the separator, fall back to comma if no pipes present.
  const separator = rawList.includes("|") ? "|" : ",";
  const suggestions = Array.from(
    new Set(
      rawList
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  const message = text.replace(match[0], "").trim();
  return { message, suggestions };
}

function parseNoorData(text: string): {
  message: string;
  analysis: NoorAnalysis | null;
} {
  const match = text.match(/<noor-data>([\s\S]*?)<\/noor-data>/i);
  if (!match) return { message: text, analysis: null };

  const body = match[1].trim();
  const cleaned = text.replace(match[0], "").trim();

  try {
    const raw = JSON.parse(body) as Partial<NoorAnalysis>;
    const analysis: NoorAnalysis = {
      profileLine: String(raw.profileLine ?? ""),
      primaryKaartTitel: String(raw.primaryKaartTitel ?? ""),
      insight: String(raw.insight ?? ""),
      acties: Array.isArray(raw.acties)
        ? raw.acties.map((a) => String(a)).filter(Boolean)
        : [],
      alternativeKaartTitels: Array.isArray(raw.alternativeKaartTitels)
        ? raw.alternativeKaartTitels.map((t) => String(t)).filter(Boolean).slice(0, 2)
        : [],
      overleg: String(raw.overleg ?? ""),
      signaal: String(raw.signaal ?? ""),
      contextChips: Array.isArray(raw.contextChips)
        ? raw.contextChips.map((c) => String(c)).filter(Boolean).slice(0, 6)
        : [],
    };
    return { message: cleaned, analysis };
  } catch (err) {
    console.warn("[chat] kon <noor-data> niet parsen:", err);
    return { message: cleaned, analysis: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Geen berichten meegegeven" }, { status: 400 });
    }

    // ── Resolve sessie (geen harde eis — middleware heeft dit al gedaan voor
    // page-navigaties; hier alleen om naam/school in de prompt te injecteren +
    // om de logGesprek-call straks van meta te voorzien)
    let personalizedSystem = SYSTEM_PROMPT;
    let leraarIdForLog: string | null = null;
    let schoolIdForLog: string | null = null;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    try {
      const cookie = request.cookies.get(AUTH_COOKIE.name);
      const session = parseSession(cookie?.value);
      if (session) {
        const leraar = await getLeraar(session.leraarId);
        if (leraar && leraar.status !== "geblokkeerd") {
          leraarIdForLog = leraar.id;
          schoolIdForLog = leraar.schoolId || null;
          const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;
          const preamble = `\n\n## Context over de gebruiker\nJe praat met ${leraar.naam}${school ? `, werkzaam op ${school.schoolnaam}` : ""}. Je mag deze naam gebruiken als dat natuurlijk valt, maar forceer het niet en herhaal het zeker niet in elk bericht.`;
          personalizedSystem = SYSTEM_PROMPT + preamble;
        }
      }
    } catch (err) {
      console.warn("[chat] kon sessie-context niet ophalen:", err);
    }

    // Tel hoeveel user-turns er al zijn. Na 5 is de intake verplicht
    // afgerond: we forceren Noor om meteen zoek_kenniskaarten aan te roepen
    // via een directieve aanvulling op de system prompt.
    const userTurnCount = messages.filter((m) => m.role === "user").length;
    if (userTurnCount >= 4) {
      personalizedSystem += `\n\n## DIRECTIEF — intake is klaar\nDe leerkracht heeft nu ${userTurnCount} berichten gegeven. Je mag GEEN nieuwe vraag meer stellen. Je volgende bericht is de check-in van Fase 1B (\"Ik hoor: ... Ik ga nu de kenniskaarten erbij pakken — één momentje.\") en direct daarna roep je zoek_kenniskaarten aan met wat je hebt. Onvolledige info is geen blocker — werk met wat voorligt.`;
    }

    const {
      messages: safeMessages,
      anyDetected: piiDetected,
      detections: piiDetections,
    } = filterPiiFromMessages(messages);

    if (piiDetected) {
      console.warn(
        `[pii-filter] gefilterd in inkomend verzoek: ${summarizeDetections(piiDetections)}`
      );
    }

    const tools: Anthropic.Tool[] = [
      {
        name: "zoek_kenniskaarten",
        description:
          "Zoek relevante kenniskaarten op basis van een zoekterm en trefwoorden. Gebruik dit als je genoeg informatie hebt van de leerkracht om te matchen.",
        input_schema: {
          type: "object" as const,
          properties: {
            zoekterm: {
              type: "string",
              description:
                "De meest relevante aandoening, diagnose of uitdaging. Bijv. 'ADD', 'angststoornis', 'motorische problemen'",
            },
            trefwoorden: {
              type: "array",
              items: { type: "string" },
              description:
                "Relevante trefwoorden voor de zoekopdracht. Bijv. ['aandacht', 'gedrag', 'plannen']",
            },
          },
          required: ["zoekterm"],
        },
      },
    ];

    // Als we al 4+ user-turns hebben, dwingen we de tool-call AF via tool_choice.
    // Het directief in de system prompt (zie hierboven) is niet altijd sterk genoeg;
    // tool_choice garandeert dat Noor niet alsnog een 5e vraag stelt.
    const forceToolCall = userTurnCount >= 4;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: personalizedSystem,
      tools,
      messages: safeMessages,
      ...(forceToolCall
        ? { tool_choice: { type: "tool" as const, name: "zoek_kenniskaarten" } }
        : {}),
    });
    totalInputTokens += response.usage?.input_tokens ?? 0;
    totalOutputTokens += response.usage?.output_tokens ?? 0;

    if (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (toolUseBlock && toolUseBlock.type === "tool_use") {
        const input = toolUseBlock.input as {
          zoekterm: string;
          trefwoorden?: string[];
        };

        const usedTrefwoorden = input.trefwoorden || [];

        const [kenniskaarten, experts] = await Promise.all([
          searchKenniskaarten(input.zoekterm, usedTrefwoorden),
          matchExperts([input.zoekterm, ...usedTrefwoorden]),
        ]);

        // Safety net: if the search returned nothing, do NOT emit an end
        // report — the final model pass would produce an empty message
        // (no data to report on) and the UI would stall. Ask Noor for one
        // more specific question instead, so the teacher stays in flow.
        if (kenniskaarten.length === 0) {
          const fallbackInstruction = `Je hebt \`zoek_kenniskaarten\` aangeroepen met zoekterm "${input.zoekterm}", maar er zijn GEEN kenniskaarten gevonden. Je mag nu GEEN eindrapport schrijven. In plaats daarvan: geef één korte reactie (max 2 zinnen) waarin je erkent dat je nog iets meer context nodig hebt om de juiste kaart te vinden, en stel precies één concrete vervolgvraag die de zoekopdracht kan verbreden of versmallen (bijvoorbeeld: specifieker gedrag, andere context, bijbehorende symptomen). Geen bullets, geen <noor-data>. Voeg desgewenst één [Suggesties: ...] regel toe aan het einde met 3-5 gerichte chips.`;

          const retryMessages: Anthropic.MessageParam[] = [
            ...safeMessages,
            { role: "assistant", content: response.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: toolUseBlock.id,
                  content: JSON.stringify({ gevonden: 0, kenniskaarten: [] }),
                },
                { type: "text", text: fallbackInstruction },
              ],
            },
          ];

          const retryResponse = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            system: personalizedSystem,
            messages: retryMessages,
          });
          totalInputTokens += retryResponse.usage?.input_tokens ?? 0;
          totalOutputTokens += retryResponse.usage?.output_tokens ?? 0;

          const retryText = retryResponse.content.find((b) => b.type === "text");
          const retryRaw = retryText?.type === "text" ? retryText.text : "";
          const { message: retryMsg, suggestions: retrySuggestions } = parseSuggestions(retryRaw);

          return NextResponse.json({
            message:
              retryMsg ||
              "Ik kan het nog niet helemaal plaatsen. Kun je één concreet voorbeeld geven van wat je ziet?",
            suggestions: retrySuggestions,
            kenniskaarten: [],
            experts,
            analysis: null,
            primaryKaartId: null,
            done: false,
            piiFiltered: piiDetected,
          });
        }

        const messagesWithTool: Anthropic.MessageParam[] = [
          ...safeMessages,
          { role: "assistant", content: response.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify({
                  gevonden: kenniskaarten.length,
                  kenniskaarten: kenniskaarten.map((k) => ({
                    titel: k.titel,
                    categorie: k.categorie,
                    samenvatting: k.samenvatting,
                    watIsHet: k.watIsHet,
                    gevolgen: k.gevolgen,
                    tips: k.tips,
                    trefwoorden: k.trefwoorden,
                    pdfUrl: k.pdfUrl,
                    bronUrl: k.bronUrl,
                  })),
                }),
              },
            ],
          },
        ];

        const finalResponse = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: personalizedSystem,
          tools,
          messages: messagesWithTool,
        });
        totalInputTokens += finalResponse.usage?.input_tokens ?? 0;
        totalOutputTokens += finalResponse.usage?.output_tokens ?? 0;

        const textContent = finalResponse.content.find((b) => b.type === "text");
        const rawText = textContent?.type === "text" ? textContent.text : "";
        const { message: withoutChips } = parseSuggestions(rawText);
        const { message, analysis } = parseNoorData(withoutChips);

        let primaryKaartId: string | null = null;
        if (analysis?.primaryKaartTitel && kenniskaarten.length > 0) {
          const needle = analysis.primaryKaartTitel.trim().toLowerCase();
          const found = kenniskaarten.find((k) => k.titel.trim().toLowerCase() === needle);
          primaryKaartId = found ? found.id : null;
        }
        if (!primaryKaartId && kenniskaarten.length > 0) {
          primaryKaartId = kenniskaarten[0].id;
        }

        // Resolve alternative top-3 kaart-ids. Als Noor aangaf onzeker te zijn
        // over welke kaart primair is, vullen we een array van max 2 extra
        // kaart-ids zodat de UI een top-3 kan tonen in plaats van geforceerd één.
        let alternativeKaartIds: string[] = [];
        if (analysis?.alternativeKaartTitels?.length) {
          const seen = new Set([primaryKaartId]);
          for (const t of analysis.alternativeKaartTitels) {
            const needle = t.trim().toLowerCase();
            const found = kenniskaarten.find((k) => k.titel.trim().toLowerCase() === needle);
            if (found && !seen.has(found.id)) {
              alternativeKaartIds.push(found.id);
              seen.add(found.id);
            }
            if (alternativeKaartIds.length >= 2) break;
          }
        }

        const safeMessage =
          message && message.trim().length > 0
            ? message
            : "Ik heb een aantal kenniskaarten gevonden die bij dit beeld passen. Rechts zie je wat Noor voor je heeft gevonden. Wil je persoonlijk advies op maat? Via de knop kun je direct contact opnemen met een expert.";

        // Analytics: log dit gesprek + eventueel meldcode-signaal.
        // We AWAITEN logGesprek hier kort zodat we de id hebben voor de meldcode-link.
        // Als het te traag is, loggen we zonder link in de catch.
        let gesprekIdForMeldcode: string | null = null;
        try {
          const primaryKaart = kenniskaarten.find((k) => k.id === primaryKaartId) || kenniskaarten[0];
          // Complete berichtenreeks: input + de nieuwe assistant-reply
          const berichten = [
            ...safeMessages.map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : "" })),
            { role: "assistant" as const, content: safeMessage },
          ].filter((m) => m.role === "user" || m.role === "assistant");
          gesprekIdForMeldcode = await logGesprek({
            schoolId: schoolIdForLog,
            leraarId: leraarIdForLog,
            zoekterm: input.zoekterm,
            categorie: primaryKaart?.categorie || "",
            kenniskaartTitels: kenniskaarten.map((k) => k.titel),
            tokensIn: totalInputTokens,
            tokensOut: totalOutputTokens,
            primaryKaart: analysis?.primaryKaartTitel || primaryKaart?.titel || "",
            samenvatting: analysis?.profileLine || "",
            berichten: berichten as { role: "user" | "assistant"; content: string }[],
          });
        } catch (err) {
          console.warn("[chat] logGesprek-prep mislukt:", err);
        }

        // Meldcode-signaal: wanneer Noor iets in het signaal-veld zet, loggen we
        // dat naar de MeldcodeSignalen-tabel voor review door aandachts-
        // functionaris. Non-blocking: mag de chat-flow niet vertragen.
        if (analysis?.signaal && analysis.signaal.trim().length > 0) {
          void logMeldcodeSignaal({
            signaalTekst: analysis.signaal,
            samenvatting: analysis.profileLine || input.zoekterm,
            leraarId: leraarIdForLog,
            schoolId: schoolIdForLog,
            gesprekId: gesprekIdForMeldcode,
          });
        }

        return NextResponse.json({
          message: safeMessage,
          suggestions: [],
          kenniskaarten,
          experts,
          analysis,
          primaryKaartId,
          alternativeKaartIds,
          done: true,
          piiFiltered: piiDetected,
        });
      }
    }

    const textContent = response.content.find((b) => b.type === "text");
    const rawText = textContent?.type === "text" ? textContent.text : "";
    const { message, suggestions } = parseSuggestions(rawText);

    return NextResponse.json({
      message,
      suggestions,
      kenniskaarten: [],
      experts: [],
      analysis: null,
      primaryKaartId: null,
      done: false,
      piiFiltered: piiDetected,
    });
  } catch (error) {
    // Structured error logging — we classify waar het fout ging zodat ops
    // in Vercel-logs direct kan filteren op source zonder stacktraces te lezen.
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    let source: "airtable" | "anthropic" | "resend" | "auth" | "unknown" = "unknown";
    const lower = message.toLowerCase();
    if (lower.includes("airtable") || lower.includes("appu") || lower.includes("tbl")) source = "airtable";
    else if (lower.includes("anthropic") || lower.includes("claude") || lower.includes("rate_limit")) source = "anthropic";
    else if (lower.includes("resend")) source = "resend";
    else if (lower.includes("session") || lower.includes("cookie") || lower.includes("unauth")) source = "auth";
    console.error(
      JSON.stringify({ level: "error", scope: "chat-api", source, message, stack: stack?.split("\n").slice(0, 5) })
    );
    return NextResponse.json(
      {
        error: "Er is iets misgegaan. Probeer het opnieuw.",
        errorSource: source,
      },
      { status: 500 }
    );
  }
}
