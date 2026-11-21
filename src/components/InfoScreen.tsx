"use client";

import type { Ref } from "react";
import { CRISIS_DIRECTORY_URL } from "./BreathingPacerGate";

export type InfoTopic = "about" | "privacy";

export interface InfoScreenProps {
  topic: InfoTopic;
  onBack: () => void;
  backLabel: string;
  headingRef?: Ref<HTMLHeadingElement>;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";

export default function InfoScreen({ topic, onBack, backLabel, headingRef }: InfoScreenProps) {
  return (
    <section aria-labelledby="info-heading" className="space-y-5">
      <button type="button" onClick={onBack} className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-300 hover:text-slate-100 ${focusRing}`}>
        <span aria-hidden="true">←</span> {backLabel}
      </button>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h1 id="info-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none">
          {topic === "about" ? "How AnchorMind works" : "Privacy & limits"}
        </h1>
        <div className="mt-4 max-w-prose space-y-4 leading-relaxed text-slate-300">
          {topic === "about" ? (
            <>
              <p>
                AnchorMind is a supportive reflection tool. It borrows ideas from cognitive behavioral therapy (CBT) and
                acceptance and commitment therapy (ACT): noticing thought patterns, separating what you know from what
                you fear, and making room for uncertainty instead of arguing with it.
              </p>
              <p>
                <strong className="text-slate-100">Help me settle</strong> runs a breathing or grounding exercise on your
                device. It doesn&apos;t use AI or send anything anywhere.
              </p>
              <p>
                <strong className="text-slate-100">Untangle a thought</strong> sends what you write to an AI model, which
                suggests a possible thought pattern, a steadier perspective, and one small thing to try. It won&apos;t
                tell you that a feared outcome can&apos;t happen, and it won&apos;t encourage checking or reassurance
                seeking.
              </p>
              <p>
                AnchorMind isn&apos;t clinically validated, doesn&apos;t diagnose, and isn&apos;t a substitute for
                professional care or emergency services. Its suggestions can be wrong — use what helps and leave the
                rest.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-slate-100">What is sent:</strong> when you choose “Find my anchor”, your text is
                sent to AnchorMind&apos;s server and then to Google&apos;s Gemini API to generate a reflection.
                Google&apos;s terms govern how it processes that text; AnchorMind doesn&apos;t control Google&apos;s
                retention.
              </p>
              <p>
                <strong className="text-slate-100">What is kept:</strong> AnchorMind has no accounts, database,
                analytics, or history. Your thoughts and reflections stay in this browser tab&apos;s memory and are gone
                when you leave or start over. The offline cache stores only the app&apos;s own files — never your text or
                reflections.
              </p>
              <p>
                <strong className="text-slate-100">Speaking instead of typing</strong> uses your browser&apos;s speech
                recognition, which may send audio to an outside provider such as your browser vendor.
              </p>
              <p>
                <strong className="text-slate-100">Crisis detection has limits.</strong> AnchorMind asks the AI to flag
                messages that may need urgent human support, but it can miss things or get them wrong. A reflection
                without a warning doesn&apos;t mean everything is safe. If you might be in danger, contact local
                emergency services, or find a crisis line at{" "}
                <a href={CRISIS_DIRECTORY_URL} target="_blank" rel="noopener noreferrer" className={`text-teal-300 underline underline-offset-4 ${focusRing}`}>
                  findahelpline.com<span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
