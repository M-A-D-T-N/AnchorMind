"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { useElapsedTimer } from "@/lib/useElapsedTimer";
import { LifebuoyIcon } from "./icons";

/* ------------------------------------------------------------------ */
/* Crisis support                                                      */
/* ------------------------------------------------------------------ */

export const CRISIS_DIRECTORY_URL = "https://findahelpline.com";

export interface CrisisAlertBannerProps {
  /** "detected" when automated analysis flagged crisis; "manual" when opened by the user. */
  variant: "detected" | "manual";
  onClose: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function CrisisAlertBanner({ variant, onClose, headingRef }: CrisisAlertBannerProps) {
  return (
    <section
      aria-labelledby="crisis-heading"
      className="rounded-2xl border border-rose-400/40 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <LifebuoyIcon width={22} height={22} />
        </span>
        <div className="space-y-4">
          <h2 id="crisis-heading" ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-slate-50 focus:outline-none">
            {variant === "detected" ? "It sounds like you may need support right now" : "Get urgent support"}
          </h2>
          <p className="leading-relaxed text-slate-300">
            {variant === "detected"
              ? "What you wrote matters, and you deserve support from a real person right now. You don't have to work through this alone or with an app."
              : "If things feel like too much, reaching out to a real person can help. You don't have to handle this alone."}
          </p>
          <ul className="space-y-3 text-slate-200">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-rose-300">•</span>
              <span>
                <strong className="font-semibold text-slate-50">
                  If you are in immediate danger or might be having a medical emergency (such as chest pain or trouble
                  breathing), contact your local emergency services now.
                </strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-rose-300">•</span>
              <span>
                Find a free, confidential crisis line in your country:{" "}
                <a
                  href={CRISIS_DIRECTORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-300 underline underline-offset-4 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                >
                  findahelpline.com
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-rose-300">•</span>
              <span>Reach out to someone you trust and let them know how you&apos;re feeling.</span>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-slate-400">
            AnchorMind&apos;s automatic check can miss things or get them wrong. A reflection without this message
            doesn&apos;t mean everything is safe — trust your own sense of what you need.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
          >
            {variant === "detected" ? "Return home" : "Back"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Breathing pacer                                                     */
/* ------------------------------------------------------------------ */

export const BREATH_PHASES = [
  { key: "inhale", label: "Breathe in", seconds: 4 },
  { key: "hold", label: "Hold, if it feels comfortable", seconds: 4 },
  { key: "exhale", label: "Breathe out slowly", seconds: 6 },
] as const;
export const BREATH_CYCLES = 3;
const CYCLE_MS = BREATH_PHASES.reduce((sum, p) => sum + p.seconds * 1000, 0);
export const BREATHING_TOTAL_MS = CYCLE_MS * BREATH_CYCLES; // 42,000 ms

export function breathingStateAt(elapsedMs: number) {
  const clamped = Math.min(Math.max(elapsedMs, 0), BREATHING_TOTAL_MS);
  const cycle = Math.min(Math.floor(clamped / CYCLE_MS), BREATH_CYCLES - 1);
  let within = clamped - cycle * CYCLE_MS;
  for (const phase of BREATH_PHASES) {
    const ms = phase.seconds * 1000;
    if (within < ms || phase.key === "exhale") {
      const progress = Math.min(within / ms, 1);
      const remainingSeconds = Math.max(Math.ceil((ms - within) / 1000), 0);
      return { cycle: cycle + 1, phase, progress, remainingSeconds };
    }
    within -= ms;
  }
  // Unreachable; satisfies the type checker.
  return { cycle: BREATH_CYCLES, phase: BREATH_PHASES[2], progress: 1, remainingSeconds: 0 };
}

function circleScale(key: string, progress: number) {
  if (key === "inhale") return 0.6 + 0.4 * progress;
  if (key === "hold") return 1;
  return 1 - 0.4 * progress;
}

export type BreathingDoneReason = "completed" | "skipped" | "stopped";

export interface BreathingPacerGateProps {
  /**
   * "gate": shown before a high-distress reflection (offers "Skip and view reflection").
   * "manual": started from "Help me settle" (offers "Stop"). Independent of any analysis.
   */
  mode?: "gate" | "manual";
  /** Called exactly once, when the exercise completes, is skipped, or is stopped. */
  onDone: (reason: BreathingDoneReason) => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

const pacerButton =
  "min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-teal-400/60 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";

export function BreathingPacerGate({ mode = "gate", onDone, headingRef }: BreathingPacerGateProps) {
  const timer = useElapsedTimer(BREATHING_TOTAL_MS, { autoStart: true });
  const [natural, setNatural] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (timer.status === "done" && !doneRef.current) {
      doneRef.current = true;
      onDoneRef.current("completed");
    }
  }, [timer.status]);

  const finishEarly = (reason: "skipped" | "stopped") => {
    if (doneRef.current) return;
    doneRef.current = true;
    timer.pause();
    onDoneRef.current(reason);
  };

  const state = breathingStateAt(timer.elapsedMs);
  const paused = timer.status === "paused";
  const scale = natural ? 0.85 : circleScale(state.phase.key, state.progress);
  const instruction = paused ? "Paused" : natural ? "Breathe at your own pace" : state.phase.label;
  const secondsLeft = Math.max(Math.ceil((BREATHING_TOTAL_MS - timer.elapsedMs) / 1000), 0);

  return (
    <section aria-labelledby="breathing-heading" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8">
      <h2 id="breathing-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
        {mode === "gate" ? "Let’s slow things down first" : "Follow a breathing rhythm"}
      </h2>
      <p className="mt-2 max-w-prose leading-relaxed text-slate-300">
        {mode === "gate"
          ? "Your reflection is ready. Before reading it, here are three slow breaths together — about 40 seconds. You can skip whenever you like."
          : "Three slow breaths, about 40 seconds."}{" "}
        Holding is optional. If counting feels uncomfortable, breathe naturally instead.
      </p>

      <div className="my-8 flex flex-col items-center gap-6">
        <div className="relative flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-teal-500/20" />
          <div
            data-testid="breathing-circle"
            className="absolute inset-0 rounded-full bg-teal-500/20 ring-1 ring-teal-400/40 transition-transform duration-100 ease-linear motion-reduce:transition-none motion-reduce:transform-none!"
            style={{ transform: `scale(${scale.toFixed(3)})` }}
          />
          <span className="relative text-5xl font-light tabular-nums text-teal-100">
            {natural ? secondsLeft : state.remainingSeconds}
          </span>
        </div>

        <div className="text-center">
          <p className="text-2xl font-medium text-slate-50" aria-live="polite" aria-atomic="true">
            {instruction}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {natural ? `${secondsLeft} seconds left` : `Breath ${state.cycle} of ${BREATH_CYCLES}`}
          </p>
        </div>

        <button
          type="button"
          aria-pressed={natural}
          onClick={() => setNatural((n) => !n)}
          className="min-h-11 rounded-full px-4 text-sm font-medium text-teal-200 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
        >
          {natural ? "Follow the rhythm again" : "Breathe at my own pace instead"}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={paused ? timer.resume : timer.pause} disabled={timer.status === "done"} className={pacerButton}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" onClick={timer.restart} disabled={timer.status === "done"} className={pacerButton}>
          Restart
        </button>
        {mode === "gate" ? (
          <button
            type="button"
            onClick={() => finishEarly("skipped")}
            className="min-h-11 rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 hover:bg-teal-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
          >
            Skip and view reflection
          </button>
        ) : (
          <button type="button" onClick={() => finishEarly("stopped")} className={pacerButton}>
            Stop
          </button>
        )}
      </div>
    </section>
  );
}

export default BreathingPacerGate;
