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

export async function POST(request: NextRequest) {
  const rl = rateLimit(`chat:${clientIdFromRequest(request)}`, 20, 10 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl) as unknown as Response;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(new TextEncoder().encode(enc(obj)));
      const done = () => { send({ type: "done" }); controller.close(); };
      const error = (msg: string) => { send({ type: "error", message: msg }); controller.close(); };

      try {
        const body = await request.json().catch(() => null);
        const messages: Message[] = Array.isArray(body?.messages) ? body.messages : [];

        if (!messages.length) return error("Geen berichten meegegeven");
        if (messages.length > 60) return error("Gesprek te lang — start een nieuw gesprek.");

        // Session
        let personalizedSystem = SYSTEM_PROMPT;
        let leraarIdForLog: string | null = null;
        let schoolIdForLog: string | null = null;
        try {
          const cookie = request.cookies.get(AUTH_COOKIE.name);
          const session = parseSession(cookie?.value);
          if (session) {
            const leraar = await getLeraar(session.leraarId);
            if (leraar && leraar.status !== "geblokkeerd") {
              leraarIdForLog = leraar.id;
              schoolIdForLog = leraar.schoolId || null;
              const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;
              personalizedSystem += `\n\n## Context over de gebruiker\nJe praat met ${leraar.naam}${school ? `, werkzaam op ${school.schoolnaam}` : ""}.`;
            }
          }
        } catch { /* ignore */ }

        const userTurnCount = messages.filter((m) => m.role === "user").length;
        if (userTurnCount >= 9) {
          personalizedSystem += `\n\n## DIRECTIEF — intake is klaar\nDe leerkracht heeft nu ${userTurnCount} berichten gegeven. Geen nieuwe vraag. Doe de Fase 1B check-in en roep meteen zoek_kenniskaarten aan.`;
        } else if (userTurnCount < 4) {
          personalizedSystem += `\n\n## DIRECTIEF — intake nog niet klaar\nDe leerkracht heeft pas ${userTurnCount} bericht${userTurnCount === 1 ? "" : "en"} gegeven. Geen tool-aanroep, geen eindrapport. Stel één gerichte vervolgvraag met chip-suggesties.`;
        }

        const { messages: safeMessages, anyDetected: piiDetected, detections: piiDetections } = filterPiiFromMessages(messages);
        if (piiDetected) {
          console.warn(`[pii-filter] ${summarizeDetections(piiDetections)}`);
          send({ type: "pii" });
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

        const firstStream = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: personalizedSystem,
          tools,
          messages: safeMessages,
          ...(toolChoiceOverride ? { tool_choice: toolChoiceOverride } : {}),
        });

        for await (const event of firstStream) {
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              // Suppress <noor-data> block from streaming — parse after
              fullText += event.delta.text;
              // Stream text up until we hit <noor-data> (don't show raw JSON to user)
              if (!fullText.includes("<noor-data>")) {
                send({ type: "chunk", text: event.delta.text });
              }
            } else if (event.delta.type === "input_json_delta") {
              // Tool input accumulating — show searching indicator once
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
          const finalStream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: personalizedSystem,
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

          // Parse the complete final response
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

          // Log gesprek
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
        // Strip any noor-data that slipped through (shouldn't happen in intake)
        const { message: cleanMsg } = parseNoorData(intakeMsg);
        send({ type: "suggestions", data: suggestions });
        // Intake message was already streamed chunk by chunk above
        // Send final parsed message for the client to replace streamed text with clean version
        send({ type: "intake_done", data: { message: cleanMsg || intakeMsg, suggestions } });
        done();

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ level: "error", scope: "chat-stream", message: msg }));
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
