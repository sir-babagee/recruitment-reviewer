"use client";

import { useState, useRef } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Search,
  User,
  FileText,
} from "lucide-react";
import type { CandidateInput } from "../lib/types";

interface Props {
  candidates: CandidateInput[];
  onChange: (candidates: CandidateInput[]) => void;
  onBack: () => void;
  onScreen: () => void;
  loading: boolean;
  error: string | null;
}

export default function CandidatePanel({
  candidates,
  onChange,
  onBack,
  onScreen,
  loading,
  error,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canScreen = candidates.some((c) => c.resumeText.trim().length > 0);

  const addCandidate = () => {
    if (candidates.length >= 3) return;
    const newId = String(Date.now());
    onChange([
      ...candidates,
      {
        id: newId,
        name: `Candidate ${candidates.length + 1}`,
        resumeText: "",
      },
    ]);
    setActiveTab(candidates.length);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length <= 1) return;
    const updated = candidates.filter((_, i) => i !== index);
    onChange(updated);
    setActiveTab(Math.min(activeTab, updated.length - 1));
  };

  const updateCandidate = (
    index: number,
    field: keyof CandidateInput,
    value: string
  ) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handlePdfUpload = async (index: number, file: File) => {
    const candidateId = candidates[index].id;
    setPdfLoading((prev) => ({ ...prev, [candidateId]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      updateCandidate(index, "resumeText", data.text);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to parse PDF";
      alert(message);
    } finally {
      setPdfLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const current = candidates[activeTab];
  const isPdfLoading = current ? pdfLoading[current.id] : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-600" />
          Candidate Resumes
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add up to 3 candidates. Paste resume text or upload a PDF.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200">
        {candidates.map((candidate, index) => (
          <button
            key={candidate.id}
            onClick={() => setActiveTab(index)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === index
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {candidate.name || `Candidate ${index + 1}`}
              {candidate.resumeText.trim().length > 0 && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </span>
          </button>
        ))}
        {candidates.length < 3 && (
          <button
            onClick={addCandidate}
            className="px-3 py-2.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {current && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor={`name-${current.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Label
              </label>
              <input
                id={`name-${current.id}`}
                type="text"
                value={current.name}
                onChange={(e) =>
                  updateCandidate(activeTab, "name", e.target.value)
                }
                placeholder="e.g., Jane Smith"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <input
                ref={(el) => {
                  fileInputRefs.current[current.id] = el;
                }}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(activeTab, file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() =>
                  fileInputRefs.current[current.id]?.click()
                }
                disabled={isPdfLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isPdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload PDF
              </button>
              {candidates.length > 1 && (
                <button
                  onClick={() => removeCandidate(activeTab)}
                  className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove candidate"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor={`resume-${current.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Resume Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id={`resume-${current.id}`}
              value={current.resumeText}
              onChange={(e) =>
                updateCandidate(activeTab, "resumeText", e.target.value)
              }
              placeholder="Paste the candidate's resume text here, or upload a PDF above..."
              rows={16}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors resize-y font-mono text-sm leading-relaxed"
            />
            {current.resumeText.trim().length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {current.resumeText.trim().split(/\s+/).length} words
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onScreen}
          disabled={!canScreen || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Screening...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Screen Candidates
            </>
          )}
        </button>
      </div>
    </div>
  );
}
