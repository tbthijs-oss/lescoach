/**
 * /api/chat/stream — SSE-streaming versie van de chat-route.
 *
 * Events (newline-delimited JSON, elk afgesloten met \n\n):
 *   data: {"type":"chunk","text":"..."}          — streaming tekstfragment
 *   data: {"type":"suggestions","data":[...]}    — chips na intake-vraag
 *   data: {"type":"searching"}                   — Noor roept zoek_kenniskaarten aan
 *   data: {"type":"result","data":{...}}          — volledig eindresultaat (kenniskaarten etc.)
 *   data: {"type":"pii"}                         — PII-filter heeft iets verwijderd
 *   data: {"type":"error","message":"..."}       — fout
 *   data: {"type":"done"}                        — stream klaar
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { searchKenniskaarten, matchExperts } from "@/lib/airtable";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { filterPiiFromMessages, summarizeDetections } from "@/lib/pii";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar, getSchool } from "@/lib/authDb";
import { logGesprek } from "@/lib/gesprekkenDb";
import { logMeldcodeSignaal } from "@/lib/meldcodeDb";
import { rateLimit, clientIdFromRequest, rateLimitResponse } from "@/lib/rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Message { role: "user" | "assistant"; content: string; }

interface NoorAnalysis {
  profileLine: string; primaryKaartTitel: string; alternativeKaartTitels: string[];
  insight: string; acties: string[]; overleg: string; signaal: string; contextChips: string[];
}

function enc(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function parseSuggestions(text: string): { message: string; suggestions: string[] } {
  const match = text.match(/\[(?:suggesties|suggestions)\s*:\s*([^\]]+)\]/i);
  if (!match) return { message: text, suggestions: [] };
  const rawList = match[1];
  const separator = rawList.includes("|") ? "|" : ",";
  const suggestions = Array.from(new Set(rawList.split(separator).map((s) => s.trim()).filter(Boolean)));
  return { message: text.replace(match[0], "").trim(), suggestions };
}

function parseNoorData(text: string): { message: string; analysis: NoorAnalysis | null } {
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
      acties: Array.isArray(raw.acties) ? raw.acties.map(String).filter(Boolean) : [],
      alternativeKaartTitels: Array.isArray(raw.alternativeKaartTitels) ? raw.alternativeKaartTitels.map(String).filter(Boolean).slice(0, 2) : [],
      overleg: String(raw.overleg ?? ""),
      signaal: String(raw.signaal ?? ""),
      contextChips: Array.isArray(raw.contextChips) ? raw.contextChips.map(String).filter(Boolean).slice(0, 6) : [],
    };
    return { message: cleaned, analysis };
  } catch { return { message: cleaned, analysis: null }; }
}

/**
 * Detecteer pogingen om Noor's instructies te omzeilen of haar te misbruiken.
 *
 * Returnt:
 *   - kind: "jailbreak" voor expliciete instructie-omzeiling / broncode-aanvraag
 *   - kind: "off-topic" voor recepten / gedichten / privé-chat etc.
 *   - null als de input gewoon onderwijsgerelateerd lijkt
 *
 * `count` telt hoeveel eerdere user-berichten in dit gesprek óók al matchten,
 * zodat de aanroeper kan escaleren (vriendelijk → markering → afsluiten).
 */
type SafetyHit = { kind: "jailbreak" | "off-topic"; count: number; matched: string };

function detectAbuse(messages: Message[]): SafetyHit | null {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUser = userMessages[userMessages.length - 1];
  if (!lastUser) return null;

  const jailbreakPatterns: RegExp[] = [
    /vergeet\s+(je\s+)?(instructies|regels|persona|rol)/i,
    /ignore\s+(your\s+)?(instructions|rules|system\s+prompt)/i,
    /pretend\s+you\s+are\s+(not|without)/i,
    /act\s+as\s+(if\s+you\s+have\s+no|a\s+different)/i,
    /you\s+are\s+now\s+(?!noor)/i,
    /jij\s+bent\s+nu\s+(?!noor)/i,
    /doe\s+alsof\s+je\s+(geen|een\s+andere)/i,
    /negeer\s+(je\s+)?(instructies|regels|systeem)/i,
    /\bsystem\s*prompt\b/i,
    /\bbroncode\b/i,
    /\bsource\s*code\b/i,
    /geef\s+(je|me)\s+(je\s+)?(instructies|prompt|broncode)/i,
    /\bDAN\s+mode\b/i,
    /\bdeveloper\s+mode\b/i,
    /\bjailbreak\b/i,
  ];

  for (const pattern of jailbreakPatterns) {
    if (pattern.test(lastUser.content)) {
      const count =
        userMessages.slice(0, -1).filter((m) =>
          jailbreakPatterns.some((p) => p.test(m.content))
        ).length + 1;
      return { kind: "jailbreak", count, matched: pattern.source };
    }
  }

  const offTopicPatterns: RegExp[] = [
    /\brecept(en)?\b\s+(voor|van|op)\b/i,
    /\b(kook|bak|braad)\s*(recept|advies|tips)\b/i,
    /\b(spaghetti|pasta|pizza|lasagne|cake|taart)\b/i,
    /\b(vertel|schrijf|maak)\s+(een\s+)?(mop|grap|joke|gedicht|verhaal|roman|liedje|song|lied)\b/i,
    /\b(hack|exploit|malware|virus|crypto|bitcoin)\b/i,
    /\bschrijf\b.*\b(code|python|javascript|sql|html)\b/i,
    /\bwapen(s)?\b/i,
    /\b(weersvoorspelling|aandelenkoers|voetbaluitslag)\b/i,
    /\bhoofdstad\s+van\b/i,
    /\bhoeveel\s+is\s+\d/i,
  ];

  for (const pattern of offTopicPatterns) {
    if (pattern.test(lastUser.content)) {
      const count =
        userMessages.slice(0, -1).filter((m) =>
          offTopicPatterns.some((p) => p.test(m.content))
        ).length + 1;
      return { kind: "off-topic", count, matched: pattern.source };
    }
  }

  return null;
}

/**
 * Bouw het response-bericht voor een safety-hit, op basis van type en
 * herhaling. Eerste keer = vriendelijk; tweede = markering; derde+ = afsluiten.
 */
function safetyResponseText(hit: SafetyHit): { text: string; suggestions: string[]; final: boolean } {
  const final = hit.count >= 3;
  if (final) {
    return {
      text:
        "Ik beëindig dit gesprek hier. Het wordt gemarkeerd voor je schoolbeheerder. " +
        "Wil je een nieuwe vraag stellen over een leerling, start dan een nieuw gesprek.",
      suggestions: [],
      final: true,
    };
  }
  if (hit.count === 2) {
    if (hit.kind === "jailbreak") {
      return {
        text:
          "Mijn instructies en broncode deel ik niet. Dit is mijn tweede waarschuwing — " +
          "verdere pogingen worden gemarkeerd voor je schoolbeheerder. " +
          "Wil je terug naar een onderwijsvraag?",
        suggestions: ["Vertel over een leerling", "Hoe werkt Noor?", "Anders..."],
        final: false,
      };
    }
    return {
      text:
        "Dit gesprek is bedoeld voor onderwijsvragen over leerlingen — niet voor " +
        "recepten, code of andere onderwerpen. Een volgende afwijkende vraag wordt gemarkeerd " +
        "voor je schoolbeheerder.",
      suggestions: ["Vertel over een leerling", "Hoe werkt Noor?", "Anders..."],
      final: false,
    };
  }
  if (hit.kind === "jailbreak") {
    return {
      text:
        "Mijn instructies deel ik niet. Ik ben Noor, en ik help leerkrachten in het " +
        "speciaal onderwijs met vragen over leerlingen. Heb je zo'n vraag?",
      suggestions: ["Vertel over een leerling", "Hoe werkt Noor?", "Anders..."],
      final: false,
    };
  }
  return {
    text:
      "Dat valt buiten wat ik voor je kan doen. Ik help leerkrachten met vragen over " +
      "leerlingen — vertel me over een leerling, dan kan ik echt iets voor je betekenen.",
    suggestions: ["Vertel over een leerling", "Hoe werkt Noor?", "Anders..."],
    final: false,
  };
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(`chat:${clientIdFromRequest(request)}`, 20, 10 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl) as unknown as Response;

  // ── Parse request body BEFORE creating the stream ─────────────────────────
  let parsedBody: { messages?: unknown } | null = null;
  try {
    parsedBody = await request.json();
  } catch {
    parsedBody = null;
  }
  const messages: Message[] = Array.isArray(parsedBody?.messages) ? parsedBody.messages as Message[] : [];

  // ── Parse session BEFORE the stream too ────────────────────────────────────
  // We splitsen het systeem-prompt in een **statisch** deel (cacheable) en
  // een **dynamisch** preamble (per-request). Anthropic prompt-caching pakt
  // dan turn 2+ uit de cache — flink sneller én goedkoper.
  let dynamicPreamble = "";
  let leraarIdForLog: string | null = null;
  let schoolIdForLog: string | null = null;
  let leraarFirstName: string | null = null;
  try {
    const cookie = request.cookies.get(AUTH_COOKIE.name);
    const session = parseSession(cookie?.value);
    if (session) {
      const leraar = await getLeraar(session.leraarId);
      if (leraar && leraar.status !== "geblokkeerd") {
        leraarIdForLog = leraar.id;
        schoolIdForLog = leraar.schoolId || null;
        leraarFirstName = (leraar.naam || "").trim().split(/\s+/)[0] || null;
        const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;
        dynamicPreamble += `\n\n## Context over de gebruiker\nJe praat met ${leraar.naam}${school ? `, werkzaam op ${school.schoolnaam}` : ""}. Voornaam om te gebruiken: **${leraarFirstName ?? leraar.naam}**. Spreek haar één keer bij voornaam aan in jouw eerste reactie van dit gesprek; daarna alleen wanneer het natuurlijk valt.`;
      }
    }
  } catch { /* ignore — founder shortcut heeft geen Airtable-record */ }

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  if (userTurnCount >= 9) {
    dynamicPreamble += `\n\n## DIRECTIEF — intake is klaar\nDe leerkracht heeft nu ${userTurnCount} berichten gegeven. Geen nieuwe vraag. Doe de Fase 1B check-in en roep meteen zoek_kenniskaarten aan.`;
  } else if (userTurnCount < 4) {
    dynamicPreamble += `\n\n## DIRECTIEF — intake nog niet klaar\nDe leerkracht heeft pas ${userTurnCount} bericht${userTurnCount === 1 ? "" : "en"} gegeven. Geen tool-aanroep, geen eindrapport. Stel één gerichte vervolgvraag met chip-suggesties.`;
  }

  // System param als array zodat we cache_control op het statische deel kunnen
  // zetten. Het dynamische preamble komt erachter en wordt niet gecached.
  const systemParam: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ...(dynamicPreamble ? [{ type: "text" as const, text: dynamicPreamble }] : []),
  ];

  const { messages: safeMessages, anyDetected: piiDetected, detections: piiDetections } = filterPiiFromMessages(messages);
  if (piiDetected) {
    console.warn(`[pii-filter] ${summarizeDetections(piiDetections)}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(new TextEncoder().encode(enc(obj)));
      const done = () => { send({ type: "done" }); controller.close(); };
      const error = (msg: string) => { send({ type: "error", message: msg }); controller.close(); };

      try {
        if (!messages.length) return error("Geen berichten meegegeven");
        if (messages.length > 60) return error("Gesprek te lang — start een nieuw gesprek.");

        if (piiDetected) send({ type: "pii" });

        // ── Jailbreak / off-topic veiligheidscheck ─────────────────────────
        // Eerste keer = vriendelijk, tweede = markering, derde+ = afsluiten
        // én loggen naar MeldcodeSignalen-tabel met [AI-MISBRUIK]-prefix
        // zodat de aandachtsfunctionaris/schoolbeheerder het terug kan vinden.
        const hit = detectAbuse(messages);
        if (hit) {
          const { text: safetyText, suggestions: safetySuggestions, final } = safetyResponseText(hit);
          send({ type: "chunk", text: safetyText });
          send({ type: "intake_done", data: { message: safetyText, suggestions: safetySuggestions } });

          if (hit.count >= 2) {
            const lastUser = messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
            void logMeldcodeSignaal({
              signaalTekst: `[AI-MISBRUIK ${hit.kind}, poging ${hit.count}] ${lastUser.slice(0, 500)}`,
              samenvatting: final
                ? `Gesprek beëindigd na herhaalde ${hit.kind}-poging.`
                : `${hit.kind === "jailbreak" ? "Jailbreak" : "Off-topic"}-poging in chat — nog niet beëindigd.`,
              leraarId: leraarIdForLog,
              schoolId: schoolIdForLog,
              gesprekId: null,
            });
          }

          console.warn(JSON.stringify({
            level: "warn", scope: "chat-safety",
            kind: hit.kind, count: hit.count, matched: hit.matched,
            leraarId: leraarIdForLog, schoolId: schoolIdForLog,
          }));
          return done();
        }

        const tools: Anthropic.Tool[] = [{
          name: "zoek_kenniskaarten",
          description: "Zoek relevante kenniskaarten op basis van een zoekterm en trefwoorden.",
          input_schema: {
            type: "object" as const,
            properties: {
              zoekterm: { type: "string", description: "Meest relevante aandoening of uitdaging." },
              trefwoorden: { type: "array", items: { type: "string" }, description: "Relevante trefwoorden." },
            },
            required: ["zoekterm"],
          },
        }];

        const forceToolCall = userTurnCount >= 9;
        const blockToolCall = userTurnCount < 4;
        type ToolChoice = NonNullable<Anthropic.MessageCreateParamsNonStreaming["tool_choice"]>;
        const toolChoiceOverride: ToolChoice | undefined = forceToolCall
          ? { type: "tool", name: "zoek_kenniskaarten" }
          : blockToolCall ? ({ type: "none" } as ToolChoice) : undefined;

        // ── Phase 1: first API call (streaming) ─────────────────────────────
        let fullText = "";
        let toolInput: { zoekterm: string; trefwoorden: string[] } | null = null;
        let toolUseId = "";

        const firstStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: systemParam,
          tools,
          messages: safeMessages,
          ...(toolChoiceOverride ? { tool_choice: toolChoiceOverride } : {}),
        });

        for await (const event of firstStream) {
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              fullText += event.delta.text;
              if (!fullText.includes("<noor-data>")) {
                send({ type: "chunk", text: event.delta.text });
              }
            }
          } else if (event.type === "content_block_start") {
            if (event.content_block.type === "tool_use") {
              toolUseId = event.content_block.id;
              send({ type: "searching" });
            }
          }
        }

        const firstMessage = await firstStream.finalMessage();

        if (firstMessage.stop_reason === "tool_use") {
          const toolBlock = firstMessage.content.find((b) => b.type === "tool_use");
          if (toolBlock && toolBlock.type === "tool_use") {
            const rawInput = toolBlock.input as Record<string, unknown>;
            toolInput = {
              zoekterm: typeof rawInput?.zoekterm === "string" ? rawInput.zoekterm.trim() : "",
              trefwoorden: Array.isArray(rawInput?.trefwoorden) ? (rawInput.trefwoorden as string[]) : [],
            };
            if (!toolInput.zoekterm) {
              const lastUser = [...safeMessages].reverse().find((m) => m.role === "user");
              toolInput.zoekterm = typeof lastUser?.content === "string" ? lastUser.content.slice(0, 100) : "gedragsproblemen";
            }
          }

          const [kenniskaarten, experts] = await Promise.all([
            searchKenniskaarten(toolInput!.zoekterm, toolInput!.trefwoorden || []),
            matchExperts([toolInput!.zoekterm, ...(toolInput!.trefwoorden || [])]),
          ]);

          if (kenniskaarten.length === 0) {
            const fallbackMsg = "Ik kan het nog niet helemaal plaatsen. Kun je één concreet voorbeeld geven van wat je ziet?";
            send({ type: "chunk", text: fallbackMsg });
            send({ type: "suggestions", data: ["Geef een voorbeeld", "Andere situatie beschrijven", "Anders..."] });
            return done();
          }

          const messagesWithTool: Anthropic.MessageParam[] = [
            ...safeMessages,
            { role: "assistant", content: firstMessage.content },
            {
              role: "user",
              content: [{
                type: "tool_result",
                tool_use_id: toolUseId || toolBlock!.id,
                content: JSON.stringify({
                  gevonden: kenniskaarten.length,
                  kenniskaarten: kenniskaarten.map((k) => ({
                    titel: k.titel, categorie: k.categorie, samenvatting: k.samenvatting,
                    watIsHet: k.watIsHet, gevolgen: k.gevolgen, tips: k.tips,
                    trefwoorden: k.trefwoorden, pdfUrl: k.pdfUrl, bronUrl: k.bronUrl,
                  })),
                }),
              }],
            },
          ];

          // ── Phase 3: stream final report ─────────────────────────────────
          let finalFullText = "";
          const finalStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: systemParam,
            tools,
            messages: messagesWithTool,
          });

          for await (const event of finalStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              finalFullText += event.delta.text;
              if (!finalFullText.includes("<noor-data>")) {
                send({ type: "chunk", text: event.delta.text });
              }
            }
          }

          const { message: withoutChips } = parseSuggestions(finalFullText);
          const { message, analysis } = parseNoorData(withoutChips);

          let primaryKaartId: string | null = null;
          if (analysis?.primaryKaartTitel) {
            const needle = analysis.primaryKaartTitel.trim().toLowerCase();
            const found = kenniskaarten.find((k) => k.titel.trim().toLowerCase() === needle);
            primaryKaartId = found?.id ?? null;
          }
          if (!primaryKaartId && kenniskaarten.length > 0) primaryKaartId = kenniskaarten[0].id;

          const alternativeKaartIds: string[] = [];
          if (analysis?.alternativeKaartTitels?.length) {
            const seen = new Set([primaryKaartId]);
            for (const t of analysis.alternativeKaartTitels) {
              const found = kenniskaarten.find((k) => k.titel.trim().toLowerCase() === t.trim().toLowerCase());
              if (found && !seen.has(found.id)) { alternativeKaartIds.push(found.id); seen.add(found.id); }
              if (alternativeKaartIds.length >= 2) break;
            }
          }

          const safeMessage = message?.trim() || "Rechts zie je wat Noor voor je heeft gevonden. Wil je persoonlijk advies op maat? Via de knop kun je direct contact opnemen met een expert.";

          try {
            const primaryKaart = kenniskaarten.find((k) => k.id === primaryKaartId) || kenniskaarten[0];
            const berichten = [
              ...safeMessages.map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content : "" })),
              { role: "assistant" as const, content: safeMessage },
            ].filter((m) => m.role === "user" || m.role === "assistant");
            const gesprekId = await logGesprek({
              schoolId: schoolIdForLog, leraarId: leraarIdForLog,
              zoekterm: toolInput!.zoekterm, categorie: primaryKaart?.categorie || "",
              kenniskaartTitels: kenniskaarten.map((k) => k.titel),
              tokensIn: 0, tokensOut: 0,
              primaryKaart: analysis?.primaryKaartTitel || primaryKaart?.titel || "",
              samenvatting: analysis?.profileLine || "",
              berichten: berichten as { role: "user" | "assistant"; content: string }[],
            });
            if (analysis?.signaal?.trim()) {
              void logMeldcodeSignaal({
                signaalTekst: analysis.signaal,
                samenvatting: analysis.profileLine || toolInput!.zoekterm,
                leraarId: leraarIdForLog, schoolId: schoolIdForLog, gesprekId,
              });
            }
          } catch (err) { console.warn("[stream] logGesprek mislukt:", err); }

          send({ type: "result", data: { message: safeMessage, kenniskaarten, experts, analysis, primaryKaartId, alternativeKaartIds, done: true, piiFiltered: piiDetected } });
          return done();
        }

        // ── Intake response (no tool call) ───────────────────────────────────
        const { message: intakeMsg, suggestions } = parseSuggestions(fullText);
        const { message: cleanMsg } = parseNoorData(intakeMsg);
        send({ type: "suggestions", data: suggestions });
        send({ type: "intake_done", data: { message: cleanMsg || intakeMsg, suggestions } });
        done();

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ level: "error", scope: "chat-stream", message: msg, stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined }));
        error("Er is iets misgegaan. Probeer het opnieuw.");
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
