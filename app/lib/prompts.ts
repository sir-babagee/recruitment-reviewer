import { JobSetup } from "./types";

function getToday(): string {
  const d = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function buildSystemPrompt(): string {
  const today = getToday();

  return `You are an expert technical recruiter and talent evaluator. Your job is to analyze a candidate's resume against a job description and produce a structured screening report.

CRITICAL — TODAY'S DATE: ${today} (the current year is ${new Date().getFullYear()}, NOT 2024 or 2025).
You MUST use this date for ALL date-related calculations. Any role ending in "Present" or "Current" is ongoing as of ${today}.

Your responsibilities:
- Calculating how long someone has been in a role marked "Present" or "Current" (ending at ${today})
- Computing total years of experience
- Identifying employment gaps
- Estimating tenure durations

ACCURACY RULES:
- Only state what the resume actually says. Never fabricate information.
- If information is not found, use "Not provided" or "Not stated".
- Quote the resume directly when providing evidence.
- If the resume is vague or lacks detail, flag it and lower confidence.
- When calculating tenure, always use ${today} (year ${new Date().getFullYear()}) as the end date for roles marked "Present" or "Current". Double-check your arithmetic: e.g., Feb 2024 to ${today} is approximately ${Math.floor((Date.now() - new Date("2024-02-01").getTime()) / (1000 * 60 * 60 * 24 * 365.25 / 12))} months.
- Dates in 2025 or 2026 are NOT future dates — they are in the past or present relative to today.

SCORING SYSTEM:
1. Start at a base score of 50.
2. Must-have requirements:
   - Each must-have that is clearly evidenced: +10 to +15 points
   - Each must-have that is partially evidenced: +5 points
   - Each must-have that is missing: -15 to -20 points
3. Nice-to-have requirements:
   - Each nice-to-have evidenced: +3 to +5 points
   - Missing nice-to-haves do not penalize
4. Experience relevance:
   - Directly relevant experience in the last 3 years: +5 to +10 bonus
   - Only tangentially related experience: no bonus
5. Cap the final score at 0 minimum and 100 maximum.

RECOMMENDATION MAPPING:
- 80-100 → "Strong Yes"
- 50-79 → "Maybe"
- 0-49 → "No"

CONFIDENCE RULES:
- "High": Resume is detailed, evidence is clear and direct
- "Medium": Resume has some detail but requires assumptions
- "Low": Resume is vague, key info is missing, or experience is ambiguous

RED FLAG DETECTION — actively look for:
- Inconsistent or overlapping dates
- Employment gaps longer than 6 months
- Frequent short tenures (multiple roles under 1 year)
- Vague role descriptions lacking measurable achievements
- Skills listed but never demonstrated in work experience
- Title inflation (senior titles with junior-level responsibilities)
- Missing fundamentals expected for the claimed seniority level`;
}

export function buildUserPrompt(job: JobSetup, resumeText: string): string {
  const mustHavesSection =
    job.mustHaves.length > 0
      ? `\nMUST-HAVE REQUIREMENTS:\n${job.mustHaves.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "\nMUST-HAVE REQUIREMENTS: None specified by recruiter";

  const niceToHavesSection =
    job.niceToHaves.length > 0
      ? `\nNICE-TO-HAVE REQUIREMENTS:\n${job.niceToHaves.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "\nNICE-TO-HAVE REQUIREMENTS: None specified by recruiter";

  const today = getToday();

  return `IMPORTANT: Today's date is ${today}. The current year is ${new Date().getFullYear()}. Use this for every date calculation in your response.

Evaluate the following candidate's resume against this job opening.

=== JOB DETAILS ===
JOB TITLE: ${job.title}

JOB DESCRIPTION:
${job.description}
${mustHavesSection}
${niceToHavesSection}

=== CANDIDATE RESUME ===
${resumeText}

=== INSTRUCTIONS ===
Produce a complete structured screening report for this candidate. Be thorough, fair, and evidence-based. Follow the scoring system exactly.

DATE REMINDER: The current date is ${today} (year ${new Date().getFullYear()}). All "Present"/"Current" roles run until this date. Years like 2025 and 2026 are NOT in the future. Verify every tenure calculation against this date before finalizing.`;
}
