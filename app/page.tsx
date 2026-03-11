"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  ClipboardCheck,
  Bot,
  Clock,
  Trash2,
} from "lucide-react";
import type {
  JobSetup,
  CandidateInput,
  ScreeningResult,
  ScreeningSession,
} from "./lib/types";
import JobSetupForm from "./components/JobSetupForm";
import CandidatePanel from "./components/CandidatePanel";
import ScreeningResults from "./components/ScreeningResults";

type Step = "job" | "candidates" | "results";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "job", label: "Job Details", icon: <Briefcase className="h-4 w-4" /> },
  { key: "candidates", label: "Candidates", icon: <Users className="h-4 w-4" /> },
  { key: "results", label: "Results", icon: <ClipboardCheck className="h-4 w-4" /> },
];

export default function Home() {
  const [step, setStep] = useState<Step>("job");
  const [job, setJob] = useState<JobSetup>({
    title: "",
    description: "",
    mustHaves: [],
    niceToHaves: [],
  });
  const [candidates, setCandidates] = useState<CandidateInput[]>([
    { id: "1", name: "Candidate 1", resumeText: "" },
  ]);
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("recruiter-sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        /* ignore corrupt data */
      }
    }
  }, []);

  const refreshSessions = () => {
    const stored = localStorage.getItem("recruiter-sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  };

  const loadSession = (session: ScreeningSession) => {
    setJob(session.job);
    setCandidates(session.candidates);
    setResults(session.results);
    setStep("results");
    setShowSessions(false);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem("recruiter-sessions", JSON.stringify(updated));
  };

  const handleScreen = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, candidates }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Screening failed");
      }

      setResults(data.results);
      setStep("results");
      refreshSessions();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep("job");
    setJob({ title: "", description: "", mustHaves: [], niceToHaves: [] });
    setCandidates([{ id: "1", name: "Candidate 1", resumeText: "" }]);
    setResults([]);
    setError(null);
    refreshSessions();
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Recruiter Copilot
                </h1>
                <p className="text-xs text-gray-400">
                  AI-powered candidate screening
                </p>
              </div>
            </div>
            {sessions.length > 0 && (
              <button
                onClick={() => {
                  refreshSessions();
                  setShowSessions(!showSessions);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                Past Sessions ({sessions.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Past Sessions Drawer */}
      {showSessions && sessions.length > 0 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Saved Sessions
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm"
                >
                  <button
                    onClick={() => loadSession(session)}
                    className="flex-1 text-left hover:text-indigo-600 transition-colors"
                  >
                    <span className="font-medium">{session.job.title}</span>
                    <span className="text-gray-400 ml-2">
                      {session.results.length} candidate
                      {session.results.length !== 1 ? "s" : ""} &middot;{" "}
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 py-4" aria-label="Progress">
            {STEPS.map((s, i) => {
              const isActive = i === stepIndex;
              const isComplete = i < stepIndex;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isComplete
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {s.icon}
                    </span>
                    <span
                      className={`text-sm font-medium hidden sm:inline transition-colors ${
                        isActive
                          ? "text-indigo-600"
                          : isComplete
                            ? "text-gray-700"
                            : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-4 h-px flex-1 transition-colors ${
                        isComplete ? "bg-indigo-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === "job" && (
            <JobSetupForm
              job={job}
              onChange={setJob}
              onNext={() => setStep("candidates")}
            />
          )}
          {step === "candidates" && (
            <CandidatePanel
              candidates={candidates}
              onChange={setCandidates}
              onBack={() => setStep("job")}
              onScreen={handleScreen}
              loading={loading}
              error={error}
            />
          )}
          {step === "results" && (
            <ScreeningResults
              results={results}
              job={job}
              candidates={candidates}
              onStartOver={handleStartOver}
            />
          )}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="rounded-2xl bg-white p-8 shadow-xl text-center max-w-sm mx-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <Bot className="h-7 w-7 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Screening candidates...
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Analyzing resumes against the job description. This usually
                takes 15–30 seconds.
              </p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-500 animate-loading-bar" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
