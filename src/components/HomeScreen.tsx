"use client";

import type { Ref } from "react";
import InstallEntry from "./InstallEntry";
import { CloudThoughtIcon, LeafIcon } from "./icons";

export interface HomeScreenProps {
  onSettle: () => void;
  onUntangle: () => void;
  onInfo: (topic: "about" | "privacy") => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";

export default function HomeScreen({ onSettle, onUntangle, onInfo, headingRef }: HomeScreenProps) {
  return (
    <section aria-labelledby="home-heading" className="space-y-8">
      <div className="space-y-2">
        <h1 id="home-heading" ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight text-slate-50 focus:outline-none sm:text-4xl">
          One small step, right now.
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-slate-300">
          Start with a pause, or make space around a difficult thought.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSettle}
          className={`group flex min-h-36 flex-col items-start gap-3 rounded-2xl bg-teal-400 p-6 text-left text-slate-950 shadow-lg shadow-teal-950/30 transition-colors hover:bg-teal-300 ${focusRing}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/10">
            <LeafIcon width={22} height={22} />
          </span>
          <span className="text-xl font-semibold">Help me settle</span>
          <span className="text-base leading-snug text-slate-900">Start a gentle breathing or grounding exercise.</span>
        </button>

        <button
          type="button"
          onClick={onUntangle}
          className={`group flex min-h-36 flex-col items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left text-slate-100 transition-colors hover:border-teal-400/60 ${focusRing}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
            <CloudThoughtIcon width={22} height={22} />
          </span>
          <span className="text-xl font-semibold">Untangle a thought</span>
          <span className="text-base leading-snug text-slate-300">Write or speak what&apos;s on your mind.</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-800 pt-5 text-sm">
        <button type="button" onClick={() => onInfo("about")} className={`min-h-11 rounded text-slate-300 underline underline-offset-4 hover:text-slate-100 ${focusRing}`}>
          How AnchorMind works
        </button>
        <button type="button" onClick={() => onInfo("privacy")} className={`min-h-11 rounded text-slate-300 underline underline-offset-4 hover:text-slate-100 ${focusRing}`}>
          Privacy &amp; limits
        </button>
        <InstallEntry />
      </div>
    </section>
  );
}
