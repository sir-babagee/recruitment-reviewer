import { z } from "zod";

export const screeningResultSchema = z.object({
  summary: z.object({
    candidateName: z
      .string()
      .describe(
        'Full name of the candidate, or "Not provided" if not found in resume'
      ),
    currentPosition: z
      .string()
      .describe('Current or most recent job title, or "Not provided"'),
    location: z
      .string()
      .describe('Location of the candidate, or "Not provided"'),
    yearsOfExperience: z
      .string()
      .describe(
        'Estimated years of relevant experience based on work history, or "Not provided"'
      ),
    seniorityEstimate: z
      .string()
      .describe("One of: Junior, Mid, Senior, Lead, or Principal"),
    salaryExpectation: z
      .string()
      .describe(
        'Salary expectation if explicitly mentioned in resume, or "Not provided"'
      ),
    noticePeriod: z
      .string()
      .describe(
        'Notice period or availability if mentioned, or "Not provided"'
      ),
    employmentHistory: z
      .array(
        z.object({
          company: z.string(),
          role: z.string(),
          tenure: z
            .string()
            .describe('e.g., "Jan 2020 – Present (4 years)"'),
          reasonForLeaving: z
            .string()
            .describe('Reason for leaving if evident, or "Not stated"'),
        })
      )
      .describe("Most recent roles ordered by recency, up to 5"),
    toolsAndPlatforms: z
      .array(z.string())
      .describe(
        "All tools, technologies, platforms, languages, and frameworks mentioned"
      ),
    personalityAndHighlights: z
      .array(
        z.object({
          title: z
            .string()
            .describe(
              'Short bold-style title, e.g., "Strong stakeholder mgmt"'
            ),
          description: z
            .string()
            .describe("Brief description of this highlight"),
        })
      )
      .describe("Career highlights, specialties, and inferred traits"),
    flags: z
      .array(z.string())
      .describe(
        "Red flags: employment gaps >6mo, job hopping (<1yr tenures), unclear scope, missing must-haves, inconsistent dates, title inflation, vague descriptions"
      ),
  }),
  evaluation: z.object({
    matchScore: z
      .number()
      .min(0)
      .max(100)
      .describe("Overall match score 0-100"),
    recommendation: z
      .enum(["Strong Yes", "Maybe", "No"])
      .describe("Overall hiring recommendation"),
    topReasons: z
      .array(z.string())
      .min(3)
      .max(3)
      .describe("Exactly 3 top reasons for this score"),
    missingRequirements: z
      .array(z.string())
      .describe(
        "Must-have requirements from the job description not evidenced in the resume"
      ),
    followUpQuestions: z
      .array(z.string())
      .min(3)
      .max(5)
      .describe("3-5 targeted follow-up questions a recruiter should ask"),
    confidence: z
      .enum(["High", "Medium", "Low"])
      .describe(
        "Confidence in this evaluation: High if strong evidence, Low if resume is vague"
      ),
  }),
  evidence: z
    .array(
      z.object({
        conclusion: z
          .string()
          .describe("A key conclusion drawn about the candidate"),
        supportingQuote: z
          .string()
          .describe(
            "Direct quote or close paraphrase from the resume supporting this conclusion"
          ),
        resumeSection: z
          .string()
          .describe(
            "Which section of the resume this evidence was found (e.g., Experience, Education, Skills)"
          ),
      })
    )
    .min(3)
    .describe("At least 3 evidence-backed conclusions"),
  scoringExplanation: z
    .string()
    .describe(
      "2-4 sentence explanation of scoring logic: how must-haves vs nice-to-haves were weighted, what boosted or penalized the score"
    ),
});

export type ScreeningResultSchema = z.infer<typeof screeningResultSchema>;
