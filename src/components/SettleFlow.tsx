"use client";

import type { Ref } from "react";
import { BreathingPacerGate } from "./BreathingPacerGate";
import GroundingTimer from "./GroundingTimer";
import { FootprintsIcon, LeafIcon } from "./icons";

export type SettleStep = "choose" | "breathing" | "grounding" | "done";

export interface SettleFlowProps {
  step: SettleStep;
  onStep: (step: SettleStep) => void;
  onHome: () => void;
  onUntangle: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";
const backButton = `inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-300 hover:text-slate-100 ${focusRing}`;
const optionCard = `flex min-h-24 w-full items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left transition-colors hover:border-teal-400/60 ${focusRing}`;

/**
 * Manual "Help me settle" exercises. Fully client-side: no AI request,
 * no API key, and works offline once the app has been loaded.
 * Independent of any analysis result.
 */
export default function SettleFlow({ step, onStep, onHome, onUntangle, headingRef }: SettleFlowProps) {
  if (step === "breathing") {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => onStep("choose")} className={backButton}>
          <span aria-hidden="true">←</span> Back
        </button>
        <BreathingPacerGate mode="manual" headingRef={headingRef} onDone={() => onStep("done")} />
      </div>
    );
  }

  if (step === "grounding") {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => onStep("choose")} className={backButton}>
          <span aria-hidden="true">←</span> Back
        </button>
        <section aria-labelledby="grounding-heading" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8">
          <h2 id="grounding-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
            Focus on what you can feel
          </h2>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-slate-100">
            Let your feet rest on the floor. Notice where they make contact — heels, soles, toes. Press down gently,
            then soften.
          </p>
          <p className="mt-2 max-w-prose leading-relaxed text-slate-300">
            If your attention wanders, that&apos;s okay. Come back to your feet whenever you notice. If standing or
            sitting this way isn&apos;t comfortable, notice your hands resting on something instead.
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm text-slate-400">Optional timer</p>
            <GroundingTimer resetLabel="Restart" />
          </div>
          <div className="mt-4 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={() => onStep("done")}
              className={`min-h-12 rounded-xl bg-teal-400 px-6 text-base font-semibold text-slate-950 hover:bg-teal-300 ${focusRing}`}
            >
              Finish
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (step === "done") {
    return (
      <section aria-labelledby="settle-done-heading" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8">
        <h2 id="settle-done-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
          You can take another moment, or continue.
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onHome}
            className={`min-h-12 rounded-xl bg-teal-400 px-6 text-base font-semibold text-slate-950 hover:bg-teal-300 ${focusRing}`}
          >
            Return home
          </button>
          <button
            type="button"
            onClick={onUntangle}
            className={`min-h-12 rounded-xl border border-slate-700 px-6 text-base font-medium text-slate-100 hover:border-teal-400/60 ${focusRing}`}
          >
            Untangle a thought
          </button>
          <button type="button" onClick={() => onStep("choose")} className={`min-h-12 rounded-xl px-4 text-base font-medium text-slate-300 hover:text-slate-100 ${focusRing}`}>
            Another exercise
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="settle-heading" className="space-y-5">
      <button type="button" onClick={onHome} className={backButton}>
        <span aria-hidden="true">←</span> Home
      </button>
      <div className="space-y-1.5">
        <h1 id="settle-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none sm:text-3xl">
          Help me settle
        </h1>
        <p className="text-base text-slate-300">Pick one. You can stop at any time.</p>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={() => onStep("breathing")} className={optionCard}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
            <LeafIcon width={22} height={22} />
          </span>
          <span>
            <span className="block text-lg font-semibold text-slate-50">Follow a breathing rhythm</span>
            <span className="block text-sm text-slate-300">Three slow breaths, about 40 seconds.</span>
          </span>
        </button>
        <button type="button" onClick={() => onStep("grounding")} className={optionCard}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
            <FootprintsIcon width={22} height={22} />
          </span>
          <span>
            <span className="block text-lg font-semibold text-slate-50">Focus on what you can feel</span>
            <span className="block text-sm text-slate-300">Notice your feet on the floor, with an optional timer.</span>
          </span>
        </button>
      </div>
    </section>
  );
}
