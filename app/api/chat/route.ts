import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { searchKenniskaarten, matchExperts } from "@/lib/airtable";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Strip [Suggesties: ...] marker from Claude's text and return chips separately */
function parseSuggestions(text: string): { message: string; suggestions: string[] } {
  const match = text.match(/\[Suggesties:\s*([^\]]+)\]/i);
  if (!match) return { message: text, suggestions: [] };
  const suggestions = match[1]
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const message = text.replace(match[0], "").trim();
  return { message, suggestions };
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Geen berichten meegegeven" }, { status: 400 });
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

    // First API call
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Handle tool use (Phase 2 → 3 transition)
    if (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (toolUseBlock && toolUseBlock.type === "tool_use") {
        const input = toolUseBlock.input as {
          zoekterm: string;
          trefwoorden?: string[];
        };

        const usedTrefwoorden = input.trefwoorden || [];

        // Search kenniskaarten and match experts in parallel
        const [kenniskaarten, experts] = await Promise.all([
          searchKenniskaarten(input.zoekterm, usedTrefwoorden),
          matchExperts([input.zoekterm, ...usedTrefwoorden]),
        ]);

        const messagesWithTool: Anthropic.MessageParam[] = [
          ...messages,
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
        const { message } = parseSuggestions(rawText); // no chips in results phase

        return NextResponse.json({
          message,
          suggestions: [], // no chips after analysis
          kenniskaarten,
          experts,
          done: true,
        });
      }
    }

    // Regular text response (intake phase) — parse chip suggestions
    const textContent = response.content.find((b) => b.type === "text");
    const rawText = textContent?.type === "text" ? textContent.text : "";
    const { message, suggestions } = parseSuggestions(rawText);

    return NextResponse.json({
      message,
      suggestions,
      kenniskaarten: [],
      experts: [],
      done: false,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
