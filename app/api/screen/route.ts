import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { screeningResultSchema } from "../../lib/schemas";
import { buildSystemPrompt, buildUserPrompt } from "../../lib/prompts";
import type { JobSetup, CandidateInput, ScreeningResult } from "../../lib/types";
import { z } from "zod";

export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepRepairJSON(value: any): any {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) {
        return deepRepairJSON(parsed);
      }
    } catch {
      /* not JSON */
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(deepRepairJSON);
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepRepairJSON(v);
    }
    return out;
  }
  return value;
}

async function screenCandidate(
  job: JobSetup,
  resumeText: string
): Promise<z.infer<typeof screeningResultSchema>> {
  const model = anthropic(
    process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"
  );
  const system = buildSystemPrompt();
  const prompt = buildUserPrompt(job, resumeText);

  // Attempt 1: tool mode (default) — best when the provider natively constrains output
  try {
    const { object } = await generateObject({
      model,
      system,
      prompt,
      schema: screeningResultSchema,
    });
    return object;
  } catch {
    /* fall through to JSON mode */
  }

  // Attempt 2: JSON mode — the model writes free-form JSON, SDK validates against schema
  try {
    const { object } = await generateObject({
      model,
      system,
      prompt,
      schema: screeningResultSchema,
      mode: "json",
    });
    return object;
  } catch (err: unknown) {
    // Try to salvage the raw text from the error
    const raw =
      err && typeof err === "object" && "text" in err
        ? (err as { text: string }).text
        : null;
    if (!raw) throw err;

    const repaired = deepRepairJSON(JSON.parse(raw));
    return screeningResultSchema.parse(repaired);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job, candidates } = body as {
      job: JobSetup;
      candidates: CandidateInput[];
    };

    if (!job?.title || !job?.description) {
      return Response.json(
        { error: "Job title and description are required" },
        { status: 400 }
      );
    }

    if (!candidates?.length || candidates.length > 3) {
      return Response.json(
        { error: "Please provide 1-3 candidates" },
        { status: 400 }
      );
    }

    const validCandidates = candidates.filter(
      (c) => c.resumeText.trim().length > 0
    );

    if (validCandidates.length === 0) {
      return Response.json(
        { error: "At least one candidate must have resume text" },
        { status: 400 }
      );
    }

    const results: ScreeningResult[] = await Promise.all(
      validCandidates.map(async (candidate) => {
        const object = await screenCandidate(job, candidate.resumeText);
        return {
          candidateId: candidate.id,
          ...object,
        } as ScreeningResult;
      })
    );

    return Response.json({ results });
  } catch (error: unknown) {
    console.error("Screening error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("API key") || message.includes("api_key")) {
      return Response.json(
        {
          error:
            "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your .env.local file.",
        },
        { status: 401 }
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
