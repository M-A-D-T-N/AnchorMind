"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BreathingPacerGate, CrisisAlertBanner } from "@/components/BreathingPacerGate";
import DistortionBreakdown from "@/components/DistortionBreakdown";
import HomeScreen from "@/components/HomeScreen";
import { AlertIcon, AnchorIcon, LifebuoyIcon } from "@/components/icons";
import InfoScreen, { type InfoTopic } from "@/components/InfoScreen";
import SettleFlow, { type SettleStep } from "@/components/SettleFlow";
import ThoughtInputPanel from "@/components/ThoughtInputPanel";
import { requestAnalysis } from "@/lib/analyzeClient";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import type { AnalysisEnvelope, ApiErrorBody, DemoPresetId, ResultSource } from "@/types/analysis";

/**
 * Every screen the app can show. Manual exercises ("settle") are separate
 * from the analysis breathing gate ("gate") and never touch analysis state.
 */
type View =
  | { name: "home" }
  | { name: "settle"; step: SettleStep }
  | { name: "thought" }
  | { name: "loading" }
  | { name: "error"; error: ApiErrorBody }
  | { name: "gate"; analysis: AnalysisEnvelope; thought: string }
  | { name: "results"; analysis: AnalysisEnvelope; thought: string }
  | { name: "crisis"; source: ResultSource }
  | { name: "info"; topic: InfoTopic; back: "home" | "thought" };

interface LastRequest {
  thought: string;
  demoPresetId?: DemoPresetId;
}

const ANNOUNCEMENTS: Record<View["name"], string> = {
  home: "Home.",
  settle: "",
  thought: "",
  loading: "Reflecting on your thought…",
  error: "Something went wrong.",
  gate: "A short breathing exercise has started. Your reflection is ready when you are.",
  results: "Your reflection is ready.",
  crisis: "Support resources are shown.",
  info: "",
};

const OFFLINE_ERROR: ApiErrorBody = {
  code: "offline",
  message:
    "You're offline, so an AI reflection isn't available right now. Your text is still here. The settle exercises work without a connection.",
  retryable: true,
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";

function viewKey(v: View): string {
  if (v.name === "settle") return `settle:${v.step}`;
  if (v.name === "info") return `info:${v.topic}`;
  return v.name;
}

export default function Home() {
  const [thought, setThought] = useState("");
  const [view, setView] = useState<View>({ name: "home" });
  const [urgentOpen, setUrgentOpen] = useState(false);
  const online = useOnlineStatus();

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<LastRequest | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRenderRef = useRef(true);

  const cancelInFlight = useCallback(() => {
    requestIdRef.current += 1; // Any late response is now stale.
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus to the heading of whatever just appeared — but not on first load,
  // so a phone keyboard never opens unexpectedly.
  const screenKey = urgentOpen ? "urgent" : viewKey(view);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [screenKey]);

  const submit = useCallback(
    async (text: string, presetId?: DemoPresetId) => {
      if (view.name === "loading") return; // Prevent duplicate submissions.
      cancelInFlight();
      const body: LastRequest = presetId ? { thought: text.trim(), demoPresetId: presetId } : { thought: text.trim() };
      lastRequestRef.current = body;

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setView({ name: "error", error: OFFLINE_ERROR });
        return;
      }

      const id = requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setView({ name: "loading" });

      try {
        const response = await requestAnalysis(body, controller.signal);
        if (id !== requestIdRef.current) return; // Stale: cancelled, reset, or urgent support opened.
        abortRef.current = null;
        if (response.kind === "crisis") {
          setView({ name: "crisis", source: response.source });
        } else if (response.kind === "error") {
          setView({ name: "error", error: response.error });
        } else if (response.result.trigger_breathing_first) {
          setView({ name: "gate", analysis: response, thought: body.thought });
        } else {
          setView({ name: "results", analysis: response, thought: body.thought });
        }
      } catch {
        // Aborted: a newer request or a cancel has already taken over.
      }
    },
    [cancelInFlight, view.name],
  );

  const retry = () => {
    const last = lastRequestRef.current;
    if (last) void submit(last.thought, last.demoPresetId);
  };

  const goHome = useCallback(
    (clearDraft = false) => {
      cancelInFlight();
      setUrgentOpen(false);
      if (clearDraft) setThought("");
      setView({ name: "home" });
    },
    [cancelInFlight],
  );

  const goThought = useCallback(
    (clearDraft = false) => {
      cancelInFlight();
      setUrgentOpen(false);
      if (clearDraft) setThought("");
      setView({ name: "thought" });
    },
    [cancelInFlight],
  );

  const cancelLoading = () => {
    cancelInFlight();
    setView({ name: "thought" });
  };

  const finishGate = useCallback(() => {
    setView((v) => (v.name === "gate" ? { name: "results", analysis: v.analysis, thought: v.thought } : v));
  }, []);

  const openUrgent = () => {
    // A late AI response must never replace the support screen.
    if (view.name === "loading") {
      cancelInFlight();
      setView({ name: "thought" });
    }
    setUrgentOpen(true);
  };

  const announcement = urgentOpen ? ANNOUNCEMENTS.crisis : ANNOUNCEMENTS[view.name];

  let screen: ReactNode;
  if (urgentOpen) {
    screen = <CrisisAlertBanner variant="manual" onClose={() => setUrgentOpen(false)} headingRef={headingRef} />;
  } else if (view.name === "crisis") {
    screen = <CrisisAlertBanner variant="detected" onClose={() => goHome(true)} headingRef={headingRef} />;
  } else if (view.name === "home") {
    screen = (
      <HomeScreen
        onSettle={() => setView({ name: "settle", step: "choose" })}
        onUntangle={() => setView({ name: "thought" })}
        onInfo={(topic) => setView({ name: "info", topic, back: "home" })}
        headingRef={headingRef}
      />
    );
  } else if (view.name === "settle") {
    screen = (
      <SettleFlow
        step={view.step}
        onStep={(step) => setView({ name: "settle", step })}
        onHome={() => goHome()}
        onUntangle={() => goThought()}
        headingRef={headingRef}
      />
    );
  } else if (view.name === "info") {
    const back = view.back;
    screen = (
      <InfoScreen
        topic={view.topic}
        backLabel={back === "home" ? "Home" : "Back to your thought"}
        onBack={() => setView(back === "home" ? { name: "home" } : { name: "thought" })}
        headingRef={headingRef}
      />
    );
  } else if (view.name === "gate") {
    screen = <BreathingPacerGate mode="gate" onDone={finishGate} headingRef={headingRef} />;
  } else if (view.name === "results") {
    screen = (
      <DistortionBreakdown
        key={view.analysis.result.grounded_reframe + view.analysis.result.panic_intensity_score}
        result={view.analysis.result}
        source={view.analysis.source}
        thought={view.thought}
        onNewReflection={() => goThought(true)}
        onHome={() => goHome(true)}
        headingRef={headingRef}
      />
    );
  } else {
    // Thought entry, including its loading and error states. The draft is always preserved.
    screen = (
      <div className="space-y-4">
        <button type="button" onClick={() => goHome()} className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-300 hover:text-slate-100 ${focusRing}`}>
          <span aria-hidden="true">←</span> Home
        </button>

        {view.name === "error" && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <AlertIcon className="mt-0.5 shrink-0 text-amber-300" />
            <div className="space-y-3">
              <h2 ref={headingRef} tabIndex={-1} className="font-semibold text-amber-100 focus:outline-none">
                We couldn&apos;t complete that reflection
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">{view.error.message}</p>
              {view.error.retryable && (
                <button
                  type="button"
                  onClick={retry}
                  className="min-h-11 rounded-xl bg-amber-400 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/20 sm:p-7">
          <ThoughtInputPanel
            value={thought}
            onChange={setThought}
            onSubmit={(text, presetId) => void submit(text, presetId)}
            loading={view.name === "loading"}
            offline={!online}
            onShowPrivacy={() => setView({ name: "info", topic: "privacy", back: "thought" })}
            headingRef={view.name === "error" ? undefined : headingRef}
          />
          {view.name === "loading" && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-400/20 bg-teal-400/5 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-teal-100">Reading your thought…</p>
                <p className="text-sm text-slate-300">This usually takes a few seconds.</p>
                <div aria-hidden="true" className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-teal-400/10">
                  <div className="anchor-drift h-full w-1/3 rounded-full bg-teal-400/60" />
                </div>
              </div>
              <button
                type="button"
                onClick={cancelLoading}
                className={`min-h-11 rounded-xl px-4 text-sm font-medium text-slate-300 underline underline-offset-4 hover:text-slate-100 ${focusRing}`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => goHome()} aria-label="AnchorMind home" className={`flex min-h-11 items-center gap-2 rounded-xl pr-2 ${focusRing}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
              <AnchorIcon />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-50">AnchorMind</span>
          </button>
          <button
            type="button"
            onClick={openUrgent}
            aria-pressed={urgentOpen}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-400/40 px-3 text-sm font-medium text-rose-200 hover:bg-rose-500/10 aria-pressed:bg-rose-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 sm:gap-2 sm:px-4"
          >
            <LifebuoyIcon width={18} height={18} />
            Get urgent support
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        {screen}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-xs leading-relaxed text-slate-400 sm:px-6">
        AnchorMind is a supportive reflection tool, not a diagnostic tool, and not a substitute for professional care or
        emergency services. It doesn&apos;t store your thoughts.
      </footer>
    </div>
  );
}
