export interface JobSetup {
  title: string;
  description: string;
  mustHaves: string[];
  niceToHaves: string[];
}

export interface CandidateInput {
  id: string;
  name: string;
  resumeText: string;
}

export interface EmploymentEntry {
  company: string;
  role: string;
  tenure: string;
  reasonForLeaving: string;
}

export interface Highlight {
  title: string;
  description: string;
}

export interface EvidenceItem {
  conclusion: string;
  supportingQuote: string;
  resumeSection: string;
}

export interface CandidateSummary {
  candidateName: string;
  currentPosition: string;
  location: string;
  yearsOfExperience: string;
  seniorityEstimate: string;
  salaryExpectation: string;
  noticePeriod: string;
  employmentHistory: EmploymentEntry[];
  toolsAndPlatforms: string[];
  personalityAndHighlights: Highlight[];
  flags: string[];
}

export interface MatchEvaluation {
  matchScore: number;
  recommendation: "Strong Yes" | "Maybe" | "No";
  topReasons: string[];
  missingRequirements: string[];
  followUpQuestions: string[];
  confidence: "High" | "Medium" | "Low";
}

export interface ScreeningResult {
  candidateId: string;
  summary: CandidateSummary;
  evaluation: MatchEvaluation;
  evidence: EvidenceItem[];
  scoringExplanation: string;
}

export interface ScreeningSession {
  id: string;
  timestamp: number;
  job: JobSetup;
  candidates: CandidateInput[];
  results: ScreeningResult[];
}
