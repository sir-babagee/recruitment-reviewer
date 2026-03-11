"use client";

import { useState } from "react";
import { Briefcase, ChevronRight, ListChecks, Sparkles } from "lucide-react";
import type { JobSetup } from "../lib/types";

interface Props {
  job: JobSetup;
  onChange: (job: JobSetup) => void;
  onNext: () => void;
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function JobSetupForm({ job, onChange, onNext }: Props) {
  const [mustHavesText, setMustHavesText] = useState(job.mustHaves.join(", "));
  const [niceToHavesText, setNiceToHavesText] = useState(job.niceToHaves.join(", "));

  const isValid = job.title.trim().length > 0 && job.description.trim().length > 0;

  const syncMustHaves = (value: string) => {
    onChange({ ...job, mustHaves: parseCommaSeparated(value) });
  };

  const syncNiceToHaves = (value: string) => {
    onChange({ ...job, niceToHaves: parseCommaSeparated(value) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-600" />
          Job Details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Describe the role you&apos;re hiring for. The more detail you provide,
          the better the candidate evaluation.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="job-title"
            className="block text-sm font-medium text-gray-700"
          >
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            value={job.title}
            onChange={(e) => onChange({ ...job, title: e.target.value })}
            placeholder="e.g., Senior Frontend Engineer"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="job-desc"
            className="block text-sm font-medium text-gray-700"
          >
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="job-desc"
            value={job.description}
            onChange={(e) => onChange({ ...job, description: e.target.value })}
            placeholder="Paste the full job description here..."
            rows={8}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors resize-y"
          />
        </div>

        <div>
          <label
            htmlFor="must-haves"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <ListChecks className="h-4 w-4 text-amber-600" />
            Must-Have Requirements
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="must-haves"
            type="text"
            value={mustHavesText}
            onChange={(e) => setMustHavesText(e.target.value)}
            onBlur={() => syncMustHaves(mustHavesText)}
            placeholder="e.g., React, TypeScript, 5+ years experience"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated. These weigh heavily in scoring.
          </p>
        </div>

        <div>
          <label
            htmlFor="nice-to-haves"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Nice-to-Have Requirements
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="nice-to-haves"
            type="text"
            value={niceToHavesText}
            onChange={(e) => setNiceToHavesText(e.target.value)}
            onBlur={() => syncNiceToHaves(niceToHavesText)}
            placeholder="e.g., Next.js, GraphQL, design system experience"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated. Bonus points but not required.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            syncMustHaves(mustHavesText);
            syncNiceToHaves(niceToHavesText);
            onNext();
          }}
          disabled={!isValid}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next: Add Candidates
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
