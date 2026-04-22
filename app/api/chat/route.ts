import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { searchKenniskaarten, matchExperts } from "@/lib/airtable";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { filterPiiFromMessages, summarizeDetections } from "@/lib/pii";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface NoorAnalysis {
  profileLine: string;
  primaryKaartTitel: string;
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

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools,
      messages: safeMessages,
    });

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
          system: SYSTEM_PROMPT,
          tools,
          messages: messagesWithTool,
        });

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

        return NextResponse.json({
          message,
          suggestions: [],
          kenniskaarten,
          experts,
          analysis,
          primaryKaartId,
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
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
