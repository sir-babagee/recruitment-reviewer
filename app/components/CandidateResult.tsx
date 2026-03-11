"use client";

import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  MessageSquareQuote,
  MinusCircle,
  Star,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { ScreeningResult } from "../lib/types";

function ScoreRing({
  score,
  size = 80,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-red-500";
  const bgColor =
    score >= 80
      ? "text-emerald-100"
      : score >= 50
        ? "text-amber-100"
        : "text-red-100";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={bgColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <span className={`absolute text-lg font-bold ${color}`}>{score}</span>
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    "Strong Yes": {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    Maybe: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    No: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle className="h-4 w-4" />,
    },
  };
  const c = config[rec] || config["No"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${c.bg} ${c.text}`}
    >
      {c.icon}
      {rec}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    High: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[confidence] || colors["Low"]}`}
    >
      Confidence: {confidence}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          {icon}
          {title}
        </h4>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface Props {
  result: ScreeningResult;
}

export default function CandidateResult({ result }: Props) {
  const { summary, evaluation, evidence, scoringExplanation } = result;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-5">
        <ScoreRing score={evaluation.matchScore} />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {summary.candidateName}
          </h3>
          <p className="text-sm text-gray-500">{summary.currentPosition}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <RecommendationBadge rec={evaluation.recommendation} />
            <ConfidenceBadge confidence={evaluation.confidence} />
          </div>
        </div>
      </div>

      {/* Mandatory Details */}
      <Section
        title="Mandatory Details"
        icon={<Briefcase className="h-4 w-4 text-indigo-500" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            ["Location", summary.location],
            ["Experience", summary.yearsOfExperience],
            ["Seniority", summary.seniorityEstimate],
            ["Salary Expectation", summary.salaryExpectation],
            ["Notice Period", summary.noticePeriod],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Employment History */}
      <Section
        title="Employment History"
        icon={<Briefcase className="h-4 w-4 text-blue-500" />}
      >
        <div className="space-y-3">
          {summary.employmentHistory.map((entry, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-50 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{entry.role}</p>
                  <p className="text-gray-500">{entry.company}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 bg-white rounded px-2 py-0.5 border border-gray-100">
                  {entry.tenure}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Reason for leaving:{" "}
                <span className="text-gray-600">{entry.reasonForLeaving}</span>
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tools & Platforms */}
      <Section
        title="Tools & Platforms"
        icon={<Wrench className="h-4 w-4 text-violet-500" />}
      >
        <div className="flex flex-wrap gap-1.5">
          {summary.toolsAndPlatforms.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
            >
              {tool}
            </span>
          ))}
        </div>
      </Section>

      {/* Highlights */}
      <Section
        title="Personality, Specialties & Highlights"
        icon={<Star className="h-4 w-4 text-amber-500" />}
      >
        <ul className="space-y-2">
          {summary.personalityAndHighlights.map((h, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-gray-800">
                &ldquo;{h.title}&rdquo;
              </span>
              <span className="text-gray-500"> &mdash; {h.description}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Flags / Red Flags */}
      {summary.flags.length > 0 && (
        <Section
          title="Flags & Red Flags"
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        >
          <ul className="space-y-1.5">
            {summary.flags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-2.5 border border-red-100"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {flag}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Match Evaluation */}
      <Section
        title="Match Evaluation"
        icon={<Lightbulb className="h-4 w-4 text-emerald-500" />}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Top 3 Reasons
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {evaluation.topReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ol>
          </div>

          {evaluation.missingRequirements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Missing Requirements
              </p>
              <ul className="space-y-1">
                {evaluation.missingRequirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-amber-700"
                  >
                    <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Follow-up Questions
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {evaluation.followUpQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* Evidence */}
      <Section
        title="Evidence & Explainability"
        icon={
          <MessageSquareQuote className="h-4 w-4 text-cyan-500" />
        }
      >
        <div className="space-y-3">
          {evidence.map((e, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-sm font-medium text-gray-800">
                {e.conclusion}
              </p>
              <blockquote className="mt-1.5 border-l-2 border-indigo-300 pl-3 text-sm italic text-gray-500">
                &ldquo;{e.supportingQuote}&rdquo;
              </blockquote>
              <p className="mt-1 text-xs text-gray-400">
                Source: {e.resumeSection}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Scoring Explanation */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Scoring Logic
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          {scoringExplanation}
        </p>
      </div>
    </div>
  );
}
