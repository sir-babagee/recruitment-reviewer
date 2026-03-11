"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clipboard,
  Check,
  Download,
  BarChart3,
  FileText,
  Save,
} from "lucide-react";
import type {
  ScreeningResult,
  JobSetup,
  CandidateInput,
  ScreeningSession,
} from "../lib/types";
import CandidateResult from "./CandidateResult";
import CompareView from "./CompareView";

interface Props {
  results: ScreeningResult[];
  job: JobSetup;
  candidates: CandidateInput[];
  onStartOver: () => void;
}

function getCandidateName(
  result: ScreeningResult,
  candidates: CandidateInput[]
) {
  const candidate = candidates.find((c) => c.id === result.candidateId);
  return (
    result.summary.candidateName ||
    candidate?.name ||
    "Unknown"
  );
}

export default function ScreeningResults({
  results,
  job,
  candidates,
  onStartOver,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<"individual" | "compare">(
    "individual"
  );
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopyToClipboard = async () => {
    const text = formatResultsAsText(results, job);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ job, results }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screening-${job.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSession = () => {
    const session: ScreeningSession = {
      id: String(Date.now()),
      timestamp: Date.now(),
      job,
      candidates,
      results,
    };

    const existing = JSON.parse(
      localStorage.getItem("recruiter-sessions") || "[]"
    );
    existing.unshift(session);
    if (existing.length > 10) existing.pop();
    localStorage.setItem("recruiter-sessions", JSON.stringify(existing));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Screening Results
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {results.length} candidate{results.length !== 1 ? "s" : ""}{" "}
            screened for{" "}
            <span className="font-medium text-gray-700">{job.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyToClipboard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Clipboard className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Copy All"}
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleSaveSession}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {saved ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved!" : "Save Session"}
          </button>
        </div>
      </div>

      {/* View toggle */}
      {results.length > 1 && (
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          <button
            onClick={() => setViewMode("individual")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "individual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Individual
          </button>
          <button
            onClick={() => setViewMode("compare")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "compare"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Compare
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === "compare" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <CompareView results={results} />
        </div>
      ) : (
        <>
          {results.length > 1 && (
            <div className="flex items-center gap-2 border-b border-gray-200">
              {results.map((result, index) => (
                <button
                  key={result.candidateId}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === index
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {getCandidateName(result, candidates)}
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      result.evaluation.matchScore >= 80
                        ? "bg-emerald-50 text-emerald-700"
                        : result.evaluation.matchScore >= 50
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {result.evaluation.matchScore}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            {results[activeTab] && (
              <CandidateResult result={results[activeTab]} />
            )}
          </div>
        </>
      )}

      <div className="flex justify-start pt-2">
        <button
          onClick={onStartOver}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          New Screening
        </button>
      </div>
    </div>
  );
}

function formatResultsAsText(
  results: ScreeningResult[],
  job: JobSetup
): string {
  let text = `SCREENING RESULTS — ${job.title}\n${"=".repeat(50)}\n\n`;

  for (const r of results) {
    text += `CANDIDATE: ${r.summary.candidateName}\n`;
    text += `Position: ${r.summary.currentPosition}\n`;
    text += `Score: ${r.evaluation.matchScore}/100 | Recommendation: ${r.evaluation.recommendation} | Confidence: ${r.evaluation.confidence}\n\n`;

    text += `MANDATORY DETAILS\n`;
    text += `  Location: ${r.summary.location}\n`;
    text += `  Experience: ${r.summary.yearsOfExperience}\n`;
    text += `  Seniority: ${r.summary.seniorityEstimate}\n`;
    text += `  Salary: ${r.summary.salaryExpectation}\n`;
    text += `  Notice: ${r.summary.noticePeriod}\n\n`;

    text += `EMPLOYMENT HISTORY\n`;
    for (const e of r.summary.employmentHistory) {
      text += `  • ${e.role} at ${e.company} (${e.tenure})\n`;
      text += `    Reason for leaving: ${e.reasonForLeaving}\n`;
    }
    text += `\n`;

    text += `TOOLS & PLATFORMS\n`;
    text += `  ${r.summary.toolsAndPlatforms.join(", ")}\n\n`;

    text += `HIGHLIGHTS\n`;
    for (const h of r.summary.personalityAndHighlights) {
      text += `  • "${h.title}" — ${h.description}\n`;
    }
    text += `\n`;

    if (r.summary.flags.length > 0) {
      text += `FLAGS\n`;
      for (const f of r.summary.flags) {
        text += `  ⚠ ${f}\n`;
      }
      text += `\n`;
    }

    text += `TOP REASONS\n`;
    r.evaluation.topReasons.forEach((reason, i) => {
      text += `  ${i + 1}. ${reason}\n`;
    });
    text += `\n`;

    if (r.evaluation.missingRequirements.length > 0) {
      text += `MISSING REQUIREMENTS\n`;
      for (const m of r.evaluation.missingRequirements) {
        text += `  - ${m}\n`;
      }
      text += `\n`;
    }

    text += `FOLLOW-UP QUESTIONS\n`;
    r.evaluation.followUpQuestions.forEach((q, i) => {
      text += `  ${i + 1}. ${q}\n`;
    });
    text += `\n`;

    text += `EVIDENCE\n`;
    for (const e of r.evidence) {
      text += `  Conclusion: ${e.conclusion}\n`;
      text += `  Quote: "${e.supportingQuote}"\n`;
      text += `  Source: ${e.resumeSection}\n\n`;
    }

    text += `SCORING: ${r.scoringExplanation}\n`;
    text += `\n${"—".repeat(40)}\n\n`;
  }

  return text;
}
