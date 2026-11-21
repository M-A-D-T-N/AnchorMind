"use client";

import type { ReactNode, Ref } from "react";
import { useElapsedTimer } from "@/lib/useElapsedTimer";
import type { AnalysisResult, ResultSource } from "@/types/analysis";
import { CheckCircleIcon, CloudThoughtIcon } from "./icons";

export const GROUNDING_MS = 60_000;

export interface DistortionBreakdownProps {
  result: AnalysisResult;
  source: ResultSource;
  onNewReflection: () => void;
  /** The thought the user submitted, shown for context. */
  thought?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";
const secondaryButton = `min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-teal-400/60 ${focusRing}`;

function DistressGauge({ score }: { score: number }) {
  const descriptor = score >= 8 ? "high" : score >= 5 ? "moderate" : "lower";
  return (
    <div className="max-w-sm space-y-1.5">
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
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
      >
        <div className="h-full rounded-full bg-teal-400/80" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="text-xs text-slate-400">An AI estimate based on your words — not a clinical assessment.</p>
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

function GroundingTimer() {
  const timer = useElapsedTimer(GROUNDING_MS);
  const remaining = Math.max(Math.ceil((GROUNDING_MS - timer.elapsedMs) / 1000), 0);
  const display = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const done = timer.status === "done";

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-14 text-2xl font-light tabular-nums text-slate-100" aria-hidden="true">
          {display}
        </span>
        <span className="sr-only">{done ? "Timer finished" : `${remaining} seconds remaining`}</span>
        {timer.status === "idle" && (
          <button
            type="button"
            onClick={timer.start}
            className={`min-h-11 rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 hover:bg-teal-300 ${focusRing}`}
          >
            Start 60-second timer
          </button>
        )}
        {(timer.status === "running" || timer.status === "paused") && (
          <button type="button" onClick={timer.status === "running" ? timer.pause : timer.resume} className={secondaryButton}>
            {timer.status === "running" ? "Pause" : "Resume"}
          </button>
        )}
        {timer.status !== "idle" && (
          <button type="button" onClick={timer.reset} className={secondaryButton}>
            Reset
          </button>
        )}
      </div>
      <p role="status" className="min-h-5 text-sm text-teal-200">
        {done ? "That's a minute of grounding. Notice how you're doing right now, whatever that is." : ""}
      </p>
    </div>
  );
}

/** One stop on the "anchor line": a numbered marker on the rail plus its content. */
function Step({
  n,
  title,
  emphasis = false,
  children,
}: {
  n: number;
  title: string;
  emphasis?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative pb-9 pl-12 after:absolute after:top-10 after:bottom-2 after:left-[15px] after:w-px after:bg-teal-400/25 last:pb-0 last:after:hidden sm:pl-14">
      <span
        aria-hidden="true"
        className={`absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          emphasis ? "bg-teal-400 text-slate-950" : "bg-slate-900 text-teal-300 ring-1 ring-teal-400/50"
        }`}
      >
        {n}
      </span>
      <h3 className="pt-1 text-sm font-semibold tracking-wide text-slate-300 uppercase">{title}</h3>
      <div className="mt-3">{children}</div>
    </li>
  );
}

export default function DistortionBreakdown({ result, source, onNewReflection, thought, headingRef }: DistortionBreakdownProps) {
  return (
    <section aria-labelledby="results-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="results-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
          Your reflection
        </h2>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
          {source === "demo" ? "Demo example" : "AI-generated reflection"}
        </span>
      </div>

      {thought && (
        <figure className="border-l-2 border-slate-700 pl-4">
          <figcaption className="text-xs font-medium tracking-wide text-slate-400 uppercase">You wrote</figcaption>
          <blockquote className="mt-1 line-clamp-4 leading-relaxed text-slate-300" title={thought}>
            {thought}
          </blockquote>
        </figure>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/20 sm:p-8">
        <ol>
          <Step n={1} title="Notice the pattern">
            <p className="text-xs text-slate-400">Possible thought pattern</p>
            <p className="mt-1.5 inline-flex rounded-full bg-teal-400/10 px-3.5 py-1.5 text-base font-semibold text-teal-200 ring-1 ring-teal-400/30">
              {result.primary_distortion_name}
            </p>
            <p className="mt-3 max-w-prose leading-relaxed text-slate-300">{result.distortion_explanation}</p>
            <div className="mt-5">
              <DistressGauge score={result.panic_intensity_score} />
            </div>
          </Step>

          <Step n={2} title="Separate facts from fears">
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
          </Step>

          <Step n={3} title="A steadier view" emphasis>
            <p className="text-xs text-slate-400">Grounded Reframe</p>
            <p className="mt-2 max-w-prose font-serif text-xl leading-relaxed text-slate-50 sm:text-2xl sm:leading-relaxed">
              {result.grounded_reframe}
            </p>
          </Step>

          <Step n={4} title="Ground your body · optional">
            <p className="max-w-prose leading-relaxed text-slate-300">{result.micro_grounding_action}</p>
            <GroundingTimer />
          </Step>
        </ol>
      </div>

      <div className="flex justify-center">
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
