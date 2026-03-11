import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { screeningResultSchema } from "../../lib/schemas";
import { buildSystemPrompt, buildUserPrompt } from "../../lib/prompts";
import type { JobSetup, CandidateInput, ScreeningResult } from "../../lib/types";

export const maxDuration = 60;

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
        let object;

        try {
          const result = await generateObject({
            model: anthropic(
              process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"
            ),
            system: buildSystemPrompt(),
            prompt: buildUserPrompt(job, candidate.resumeText),
            schema: screeningResultSchema,
          });
          object = result.object;
        } catch (err: unknown) {
          // Anthropic sometimes returns nested arrays/objects as JSON strings.
          // Extract the raw text, repair the stringified fields, and re-validate.
          const raw =
            err && typeof err === "object" && "text" in err
              ? (err as { text: string }).text
              : null;
          if (!raw) throw err;

          const parsed = JSON.parse(raw);
          for (const key of Object.keys(parsed)) {
            if (typeof parsed[key] === "string") {
              try {
                const maybeParsed = JSON.parse(parsed[key]);
                if (typeof maybeParsed === "object") {
                  parsed[key] = maybeParsed;
                }
              } catch {
                // Not JSON, leave as-is
              }
            }
          }
          object = screeningResultSchema.parse(parsed);
        }

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
