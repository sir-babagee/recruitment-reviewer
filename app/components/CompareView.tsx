"use client";

import { CheckCircle2, HelpCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ScreeningResult } from "../lib/types";

interface Props {
  results: ScreeningResult[];
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">
        {score}
      </span>
    </div>
  );
}

function RecIcon({ rec }: { rec: string }) {
  if (rec === "Strong Yes")
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (rec === "Maybe")
    return <HelpCircle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

export default function CompareView({ results }: Props) {
  if (results.length < 2) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Add at least 2 candidates to compare side-by-side.
      </p>
    );
  }

  const rows: {
    label: string;
    render: (r: ScreeningResult) => React.ReactNode;
  }[] = [
    {
      label: "Match Score",
      render: (r) => <ScoreBar score={r.evaluation.matchScore} />,
    },
    {
      label: "Recommendation",
      render: (r) => (
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
          <RecIcon rec={r.evaluation.recommendation} />
          {r.evaluation.recommendation}
        </span>
      ),
    },
    {
      label: "Confidence",
      render: (r) => {
        const colors: Record<string, string> = {
          High: "text-emerald-600",
          Medium: "text-amber-600",
          Low: "text-red-600",
        };
        return (
          <span className={`text-sm font-medium ${colors[r.evaluation.confidence]}`}>
            {r.evaluation.confidence}
          </span>
        );
      },
    },
    {
      label: "Seniority",
      render: (r) => (
        <span className="text-sm font-medium text-gray-900">{r.summary.seniorityEstimate}</span>
      ),
    },
    {
      label: "Experience",
      render: (r) => (
        <span className="text-sm font-medium text-gray-900">{r.summary.yearsOfExperience}</span>
      ),
    },
    {
      label: "Location",
      render: (r) => <span className="text-sm text-gray-800">{r.summary.location}</span>,
    },
    {
      label: "Missing Reqs",
      render: (r) => (
        <span className="text-sm">
          {r.evaluation.missingRequirements.length === 0 ? (
            <span className="text-emerald-600 font-medium">None</span>
          ) : (
            <span className="text-red-600 font-medium">
              {r.evaluation.missingRequirements.length} missing
            </span>
          )}
        </span>
      ),
    },
    {
      label: "Flags",
      render: (r) => (
        <span className="text-sm">
          {r.summary.flags.length === 0 ? (
            <span className="text-emerald-600 font-medium">None</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {r.summary.flags.length} flag{r.summary.flags.length > 1 ? "s" : ""}
            </span>
          )}
        </span>
      ),
    },
    {
      label: "Top Reason",
      render: (r) => (
        <p className="text-sm text-gray-800">{r.evaluation.topReasons[0]}</p>
      ),
    },
  ];

  const best = results.reduce((prev, curr) =>
    curr.evaluation.matchScore > prev.evaluation.matchScore ? curr : prev
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
              Metric
            </th>
            {results.map((r) => (
              <th
                key={r.candidateId}
                className="py-3 px-4 text-sm font-semibold text-gray-900"
              >
                <div className="flex items-center gap-1.5">
                  {r.summary.candidateName}
                  {r.candidateId === best.candidateId && (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-100">
                      TOP
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {row.label}
              </td>
              {results.map((r) => (
                <td key={r.candidateId} className="py-3 px-4">
                  {row.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
