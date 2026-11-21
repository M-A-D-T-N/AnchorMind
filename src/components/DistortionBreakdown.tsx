"use client";

import type { Ref } from "react";
import type { AnalysisResult, ResultSource } from "@/types/analysis";
import GroundingTimer from "./GroundingTimer";
import { CheckCircleIcon, CloudThoughtIcon, FootprintsIcon, LeafIcon } from "./icons";

export { GROUNDING_MS } from "./GroundingTimer";

export interface DistortionBreakdownProps {
  result: AnalysisResult;
  source: ResultSource;
  onNewReflection: () => void;
  onHome?: () => void;
  /** The thought the user submitted, shown for context inside the details. */
  thought?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";

function DistressEstimate({ score }: { score: number }) {
  const descriptor = score >= 8 ? "high" : score >= 5 ? "moderate" : "lower";
  return (
    <div className="max-w-xs space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span id="distress-label" className="text-slate-400">
          Estimated distress
        </span>
        <span className="tabular-nums text-slate-200">
          {score} / 10 <span className="text-slate-400">· {descriptor}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby="distress-label"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={score}
        aria-valuetext={`${score} out of 10, ${descriptor}`}
        className="h-1 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <div className="h-full rounded-full bg-slate-400" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="text-xs text-slate-400">An AI estimate based on your words. It is not a diagnosis or a measure of danger.</p>
    </div>
  );
}

function EvidenceColumn({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  tone: "fact" | "assumption";
  emptyText: string;
}) {
  const fact = tone === "fact";
  const Icon = fact ? CheckCircleIcon : CloudThoughtIcon;
  return (
    <div className={`rounded-xl border p-4 ${fact ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"}`}>
      <h4 className={`flex items-center gap-2 text-sm font-semibold ${fact ? "text-emerald-200" : "text-amber-200"}`}>
        <Icon width={18} height={18} className={fact ? "text-emerald-300" : "text-amber-300"} />
        {title}
      </h4>
      <p className="mt-0.5 text-xs text-slate-400">{fact ? "What you described happening" : "What the anxiety is predicting"}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed text-slate-200">
              <span aria-hidden="true" className={`mt-px font-semibold ${fact ? "text-emerald-300" : "text-amber-300"}`}>
                {fact ? "✓" : "?"}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

/**
 * Results with progressive disclosure: the reframe and one action first,
 * the detailed look at the thought behind "Look at the thought".
 */
export default function DistortionBreakdown({ result, source, onNewReflection, onHome, thought, headingRef }: DistortionBreakdownProps) {
  return (
    <section aria-labelledby="results-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="results-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
          Your reflection
        </h2>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
          {source === "demo" ? "Demo example" : "AI-generated reflection"}
        </span>
      </div>

      <div className="rounded-2xl border border-teal-400/30 bg-slate-900 p-5 shadow-lg shadow-black/20 sm:p-7">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-teal-200">
          <LeafIcon width={18} height={18} /> A steadier perspective
        </h3>
        <p className="mt-3 max-w-prose font-serif text-xl leading-relaxed text-slate-50 sm:text-2xl sm:leading-relaxed">
          {result.grounded_reframe}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <FootprintsIcon width={18} height={18} /> One thing to try now
        </h3>
        <p className="mt-3 max-w-prose leading-relaxed text-slate-200">{result.micro_grounding_action}</p>
        <p className="mt-1 text-sm text-slate-400">Optional — skip it if it doesn&apos;t suit you right now.</p>
        <div className="mt-4">
          <GroundingTimer />
        </div>
      </div>

      <details className="group rounded-2xl border border-slate-800 bg-slate-900">
        <summary
          className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 text-base font-medium text-slate-100 hover:bg-slate-800/50 sm:px-7 [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          Look at the thought
          <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="space-y-6 border-t border-slate-800 px-5 pt-5 pb-6 sm:px-7">
          {thought && (
            <figure className="border-l-2 border-slate-700 pl-4">
              <figcaption className="text-xs font-medium tracking-wide text-slate-400 uppercase">You wrote</figcaption>
              <blockquote className="mt-1 line-clamp-4 leading-relaxed text-slate-300" title={thought}>
                {thought}
              </blockquote>
            </figure>
          )}

          <div>
            <p className="text-xs text-slate-400">Possible thought pattern</p>
            <p className="mt-1.5 inline-flex rounded-full bg-teal-400/10 px-3.5 py-1.5 text-base font-semibold text-teal-200 ring-1 ring-teal-400/30">
              {result.primary_distortion_name}
            </p>
            <p className="mt-3 max-w-prose leading-relaxed text-slate-300">{result.distortion_explanation}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EvidenceColumn
              title="Objective Facts"
              tone="fact"
              items={result.objective_facts}
              emptyText="There isn't enough concrete detail here to list observable facts — and that's okay. Noticing what you actually know versus what you fear is a useful step on its own."
            />
            <EvidenceColumn
              title="Anxious Assumptions"
              tone="assumption"
              items={result.anxious_assumptions}
              emptyText="No specific predictions or assumptions stood out in what you wrote."
            />
          </div>

          <DistressEstimate score={result.panic_intensity_score} />
        </div>
      </details>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-center">
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className={`min-h-12 rounded-xl px-6 text-base font-medium text-slate-300 hover:text-slate-100 ${focusRing}`}
          >
            Return home
          </button>
        )}
        <button
          type="button"
          onClick={onNewReflection}
          className={`min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-6 text-base font-medium text-slate-100 hover:border-teal-400/60 ${focusRing}`}
        >
          Start a new reflection
        </button>
      </div>
    </section>
  );
}
