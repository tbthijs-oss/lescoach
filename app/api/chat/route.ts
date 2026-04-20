import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { searchKenniskaarten } from "@/lib/airtable";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Geen berichten meegegeven" }, { status: 400 });
    }

    // Tool definition for searching kenniskaarten
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

    // Handle tool use
    if (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");

      if (toolUseBlock && toolUseBlock.type === "tool_use") {
        const input = toolUseBlock.input as {
          zoekterm: string;
          trefwoorden?: string[];
        };

        // Search kenniskaarten
        const kenniskaarten = await searchKenniskaarten(
          input.zoekterm,
          input.trefwoorden || []
        );

        // Continue conversation with tool result
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
        return NextResponse.json({
          message: textContent?.type === "text" ? textContent.text : "",
          kenniskaarten,
        });
      }
    }

    // Regular text response
    const textContent = response.content.find((b) => b.type === "text");
    return NextResponse.json({
      message: textContent?.type === "text" ? textContent.text : "",
      kenniskaarten: [],
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
