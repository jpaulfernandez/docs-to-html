"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import DropZone from "@/components/DropZone";
import ThemeSelector from "@/components/ThemeSelector";
import PreflightReport from "@/components/PreflightReport";
import ReviewShell from "@/components/ReviewShell";
import PublishScreen from "@/components/PublishScreen";
import { PreflightResult } from "@/lib/types/parser";

type AppStage = "upload" | "preflight" | "generating" | "review" | "publish";
type SubmitState = "idle" | "uploading" | "error";

const UPLOAD_MESSAGES = [
  "Extracting raw text from your document...",
  "Scanning for structure and headings...",
  "Detecting annotations and keywords...",
  "Sending document to Gemini AI...",
  "Inferring content blocks and archetypes...",
  "Identifying pull quotes and key passages...",
  "Classifying section layouts...",
  "Running editorial validation checks...",
  "Mapping design tokens to content...",
  "Almost there — finalizing structure...",
];

const STAGES = ["Upload", "Analyze", "Review", "Publish"];
const stageToIndex: Record<AppStage, number> = {
  upload: 0,
  preflight: 1,
  generating: 1,
  review: 2,
  publish: 3,
};

export default function UploadPage() {
  const { files, selectedTheme, setPreflight, setGeneratedHtml, reset } = useAppStore();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [appStage, setAppStage] = useState<AppStage>("upload");
  const [preflight, setPreflight_local] = useState<PreflightResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);

  const hasDocx = files.some((f) => f.type === "docx");
  const canSubmit = hasDocx && selectedTheme !== null && submitState !== "uploading";
  const currentStageIndex = stageToIndex[appStage];
  const [uploadMsgIndex, setUploadMsgIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  // beforeunload guard when session is active
  useEffect(() => {
    if (appStage === "upload") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [appStage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitState("uploading");
    setServerError(null);
    setUploadMsgIndex(0);
    setUploadProgress(0);

    // Animate upload messages
    const msgTimer = setInterval(() => {
      setUploadMsgIndex((i) => (i + 1) % UPLOAD_MESSAGES.length);
    }, 2200);
    // Animate progress bar — slowly creep up to ~90% while waiting
    const progressTimer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 88) { clearInterval(progressTimer); return p; }
        return p + Math.random() * 4;
      });
    }, 1000);

    const formData = new FormData();
    formData.append("theme", selectedTheme!);
    for (const entry of files) {
      formData.append("files", entry.file, entry.file.name);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data: PreflightResult = await res.json();
      clearInterval(msgTimer);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (!res.ok) {
        setServerError(data.error ?? "An unexpected error occurred. Please try again.");
        setSubmitState("error");
        return;
      }

      setPreflight(data);
      setPreflight_local(data);
      setAppStage("preflight");
      setSubmitState("idle");
    } catch {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
      setServerError("Could not reach the server. Check your connection and try again.");
      setSubmitState("error");
    }
  }

  function handleGoBack() {
    setPreflight_local(null);
    setAppStage("upload");
    setGenerationError(null);
  }

  const GENERATION_STEPS = [
    "Parsed document sections",
    "Classified section archetypes",
    "Mapped UI components",
    "Injected design tokens",
    "Built animation scripts",
    "Assembled final HTML",
  ];

  async function handleGenerate() {
    if (!preflight) return;
    setAppStage("generating");
    setGenerationError(null);
    setGenerationStep(0);

    // Animate steps while waiting
    const stepTimer = setInterval(() => {
      setGenerationStep((s) => Math.min(s + 1, GENERATION_STEPS.length - 1));
    }, 900);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preflight),
      });
      const data = await res.json();
      clearInterval(stepTimer);

      if (!res.ok || !data.html) {
        setGenerationError(data.error ?? "Generation failed. Please try again.");
        setAppStage("preflight");
        return;
      }

      setGeneratedHtml(data.html);
      setGenerationStep(GENERATION_STEPS.length);
      setTimeout(() => setAppStage("review"), 400);
    } catch {
      clearInterval(stepTimer);
      setGenerationError("Could not reach the server. Please try again.");
      setAppStage("preflight");
    }
  }

  function handleStartNew() {
    if (
      !window.confirm(
        "Start a new session?\nYour current microsite will be lost unless you've downloaded it."
      )
    )
      return;
    reset();
    setPreflight_local(null);
    setAppStage("upload");
    setServerError(null);
    setSubmitState("idle");
    setGenerationError(null);
  }

  // Full-screen stages (no shared layout)
  if (appStage === "review") {
    return (
      <ReviewShell
        onPublish={() => setAppStage("publish")}
        onStartNew={handleStartNew}
      />
    );
  }

  if (appStage === "publish") {
    return (
      <PublishScreen
        onBackToEdit={() => setAppStage("review")}
        onStartNew={handleStartNew}
      />
    );
  }

  return (
    <main className="min-h-screen bg-ghost flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-ash bg-white px-6 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold text-navy tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            rappler
          </span>
          <span className="w-px h-5 bg-ash" />
          <span className="text-sm text-system-gray font-sans">Doc to Microsite</span>
        </div>

        <nav className="ml-auto flex items-center gap-1.5" aria-label="Progress steps">
          {STAGES.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              <div
                className={[
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-medium",
                  i === currentStageIndex ? "bg-orange-courage text-white" : "text-system-gray",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                    i === currentStageIndex ? "bg-white/20" : "bg-ash text-midblue",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
                {step}
              </div>
              {i < 3 && (
                <svg className="w-3 h-3 text-vanilla-darker" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M4 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ))}
        </nav>

        {appStage !== "upload" && (
          <button
            type="button"
            onClick={handleStartNew}
            className="ml-4 text-xs text-system-gray underline underline-offset-2 hover:text-navy font-sans"
          >
            Start new
          </button>
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Upload Loading Screen */}
        {submitState === "uploading" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="space-y-2">
              {/* Animated orb */}
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-orange-courage/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-courage to-navy flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "Georgia, serif" }}>
                Analyzing your document
              </h2>
              <p className="text-sm text-system-gray font-sans min-h-[40px] transition-all duration-500">
                {UPLOAD_MESSAGES[uploadMsgIndex]}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-ash rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-orange-courage to-navy rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>

            <p className="text-xs text-system-gray font-sans">
              This can take up to 30–60 seconds for AI processing.
            </p>
          </div>
        )}

        {/* Stage 1: Upload */}
        {appStage === "upload" && submitState !== "uploading" && (
          <div className="w-full max-w-xl space-y-8">
            <div className="text-center space-y-2">
              <h1
                className="text-3xl font-bold text-navy leading-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Turn your Google Doc into a microsite
              </h1>
              <p className="text-sm text-system-gray font-sans max-w-sm mx-auto">
                Export your doc as .docx, add .csv files for charts, and we&apos;ll build a
                production-ready microsite in seconds.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-xs font-sans font-semibold text-system-gray uppercase tracking-wider">
                  1 — Files
                </h2>
                <DropZone />
              </section>

              <section className="space-y-2">
                <h2 className="text-xs font-sans font-semibold text-system-gray uppercase tracking-wider">
                  2 — Theme
                </h2>
                <ThemeSelector />
              </section>

              {serverError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p>{serverError}</p>
                    <button
                      type="button"
                      onClick={() => { setServerError(null); setSubmitState("idle"); }}
                      className="mt-1 text-xs underline underline-offset-2 hover:text-red-900"
                    >
                      Dismiss and retry
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-sans font-semibold text-sm transition-all",
                  canSubmit
                    ? "bg-orange-courage text-white hover:bg-navy shadow-sm hover:shadow-md cursor-pointer"
                    : "bg-ash text-system-gray cursor-not-allowed",
                ].join(" ")}
              >
                <>
                  Upload &amp; Analyze
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </>
              </button>

              {!canSubmit && submitState === "idle" && (
                <p className="text-center text-xs text-system-gray">
                  {!hasDocx && !selectedTheme
                    ? "Add a .docx file and select a theme to continue."
                    : !hasDocx
                      ? "Add a .docx file to continue."
                      : "Select a theme to continue."}
                </p>
              )}
            </form>

            <p className="text-center text-xs text-system-gray">
              New to annotations?{" "}
              <a href="#" className="text-orange-courage underline underline-offset-2 hover:text-navy">
                Download a sample annotated document
              </a>
            </p>
          </div>
        )}

        {/* Stage 2a: Preflight */}
        {appStage === "preflight" && preflight && (
          <div className="w-full max-w-xl space-y-4">
            {generationError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <span>❌</span>
                <p>{generationError}</p>
              </div>
            )}
            <PreflightReport
              result={preflight}
              onGoBack={handleGoBack}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* Stage 2b: Generating */}
        {appStage === "generating" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="space-y-1">
              <h2
                className="text-2xl font-bold text-navy"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Generating your microsite
              </h2>
              <p className="text-sm text-system-gray">This takes about 5–10 seconds…</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-ash rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-orange-courage rounded-full transition-all duration-500"
                style={{ width: `${((generationStep + 1) / GENERATION_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step list */}
            <ul className="text-left space-y-2">
              {GENERATION_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-sm font-sans">
                  {i < generationStep ? (
                    <span className="text-green-500">✅</span>
                  ) : i === generationStep ? (
                    <svg className="w-4 h-4 animate-spin text-orange-courage" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-ash inline-block" />
                  )}
                  <span className={i <= generationStep ? "text-navy" : "text-system-gray"}>
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-ash bg-white px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-system-gray font-sans">
          No account needed. Files are processed securely and not stored beyond your session.
        </span>
        <span className="text-xs text-system-gray font-sans">Rappler · 2026</span>
      </footer>
    </main>
  );
}
