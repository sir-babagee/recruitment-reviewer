import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { screeningResultSchema } from "../../lib/schemas";
import { buildSystemPrompt, buildUserPrompt } from "../../lib/prompts";
import type {
  JobSetup,
  CandidateInput,
  ScreeningResult,
} from "../../lib/types";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coerceToSchema(data: any): any {
  if (typeof data !== "object" || data === null) return data;

  if (typeof data.evidence === "string") {
    try {
      data.evidence = JSON.parse(data.evidence);
    } catch {
      data.evidence = [
        {
          conclusion: data.evidence,
          supportingQuote: "See resume",
          resumeSection: "General",
        },
      ];
    }
  }

  if (Array.isArray(data.evidence)) {
    while (data.evidence.length < 3) {
      data.evidence.push({
        conclusion: "Insufficient data in resume",
        supportingQuote: "N/A",
        resumeSection: "General",
      });
    }
  }

  const arrayFields = ["topReasons", "missingRequirements", "followUpQuestions"];
  if (data.evaluation && typeof data.evaluation === "object") {
    for (const field of arrayFields) {
      if (typeof data.evaluation[field] === "string") {
        try {
          data.evaluation[field] = JSON.parse(data.evaluation[field]);
        } catch {
          data.evaluation[field] = [data.evaluation[field]];
        }
      }
    }

    if (Array.isArray(data.evaluation.topReasons)) {
      while (data.evaluation.topReasons.length < 3) {
        data.evaluation.topReasons.push("No additional reason provided");
      }
    }

    if (Array.isArray(data.evaluation.followUpQuestions)) {
      while (data.evaluation.followUpQuestions.length < 3) {
        data.evaluation.followUpQuestions.push(
          "What other relevant experience can you share?"
        );
      }
    }
  }

  if (data.summary && typeof data.summary === "object") {
    for (const field of [
      "employmentHistory",
      "toolsAndPlatforms",
      "personalityAndHighlights",
      "flags",
    ]) {
      if (typeof data.summary[field] === "string") {
        try {
          data.summary[field] = JSON.parse(data.summary[field]);
        } catch {
          data.summary[field] = [data.summary[field]];
        }
      }
    }
  }

  return data;
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

  try {
    const { output } = await generateText({
      model,
      system,
      prompt,
      output: Output.object({ schema: screeningResultSchema }),
    });

    if (output) return output;
    throw new Error("No output generated");
  } catch (err: unknown) {
    if (NoObjectGeneratedError.isInstance(err) && err.text) {
      const raw = deepRepairJSON(JSON.parse(err.text));
      const coerced = coerceToSchema(raw);
      return screeningResultSchema.parse(coerced);
    }
    throw err;
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
