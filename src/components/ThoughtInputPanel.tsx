"use client";

import { useCallback, useEffect, useId, useState, type FormEvent, type Ref } from "react";
import { DEMO_PRESETS } from "@/lib/presets";
import { THOUGHT_MAX_CHARS } from "@/lib/schemas";
import { appendTranscript, useSpeechRecognition } from "@/lib/useSpeechRecognition";
import type { DemoPresetId } from "@/types/analysis";
import { MicIcon, StopIcon } from "./icons";

export interface ThoughtInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, presetId?: DemoPresetId) => void;
  loading: boolean;
  /** True when the browser reports no network connection. */
  offline?: boolean;
  /** Opens the fuller privacy information. */
  onShowPrivacy?: () => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function validateThought(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Please write a thought first — even a few words is enough.";
  if (trimmed.length > THOUGHT_MAX_CHARS) {
    return `Please shorten this to ${THOUGHT_MAX_CHARS.toLocaleString("en-US")} characters or fewer.`;
  }
  return null;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";

export default function ThoughtInputPanel({
  value,
  onChange,
  onSubmit,
  loading,
  offline = false,
  onShowPrivacy,
  textareaRef,
  headingRef,
}: ThoughtInputPanelProps) {
  const ids = { field: useId(), help: useId(), error: useId(), count: useId(), privacy: useId() };
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFinalSpeech = useCallback(
    (text: string) => {
      onChange(appendTranscript(value, text));
    },
    [onChange, value],
  );
  const speech = useSpeechRecognition(handleFinalSpeech);
  const { stop: stopSpeech } = speech;

  // Never leave the microphone running when this screen goes away.
  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const length = value.trim().length;
  const overLimit = length > THOUGHT_MAX_CHARS;
  const shownError = validationError ?? (overLimit ? validateThought(value) : null);

  const submitText = (text: string, presetId?: DemoPresetId) => {
    if (loading) return;
    speech.stop();
    const problem = validateThought(text);
    setValidationError(problem);
    if (problem) return;
    onSubmit(text, presetId);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitText(value);
  };

  const handlePreset = (presetId: DemoPresetId, text: string) => {
    if (loading) return;
    onChange(text);
    // Pass the exact text directly to avoid submitting stale state.
    submitText(text, presetId);
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 focus:outline-none sm:text-3xl">
        <label htmlFor={ids.field}>What is your mind telling you right now?</label>
      </h1>
      <p id={ids.help} className="mt-1.5 text-base text-slate-300">
        A few words is enough.
      </p>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 transition-colors focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/30 has-[textarea[aria-invalid=true]]:border-amber-400">
        <textarea
          id={ids.field}
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (validationError) setValidationError(null);
          }}
          rows={3}
          disabled={loading}
          placeholder="For example: “What if I mess this up and everyone notices?”"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={`${ids.help} ${ids.count} ${ids.privacy}${shownError ? ` ${ids.error}` : ""}`}
          className="block field-sizing-content max-h-[50vh] min-h-24 w-full resize-y rounded-t-xl bg-transparent px-4 pt-3 pb-2 text-base leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-2 py-1.5">
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={loading || !speech.supported}
            aria-pressed={speech.listening}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-rose-500/15 aria-pressed:text-rose-100 ${focusRing}`}
          >
            {speech.listening ? (
              <>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rose-400 motion-safe:animate-pulse" />
                <StopIcon width={18} height={18} />
                Stop recording
              </>
            ) : (
              <>
                <MicIcon width={18} height={18} />
                Speak instead
              </>
            )}
          </button>
          <p id={ids.count} className={`pr-2 text-sm tabular-nums ${overLimit ? "text-amber-300" : "text-slate-400"}`}>
            {length.toLocaleString("en-US")} / {THOUGHT_MAX_CHARS.toLocaleString("en-US")}
            <span className="sr-only"> characters</span>
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-sm">
        {shownError && (
          <p id={ids.error} role="alert" className="text-amber-300">
            {shownError}
          </p>
        )}
        {speech.listening && (
          <p className="text-rose-100" role="status">
            Recording… speak naturally, then press Stop recording.
          </p>
        )}
        {speech.error && (
          <p role="alert" className="text-amber-300">
            {speech.error}
          </p>
        )}
        {!speech.supported && <p className="text-slate-400">Voice input isn&apos;t available in this browser — typing works just as well.</p>}
        {speech.supported && (speech.listening || value.length === 0) && (
          <p className="text-xs text-slate-400">Speaking uses your browser&apos;s speech recognition, which may send audio to an outside provider.</p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-7 text-base font-semibold text-slate-950 transition-colors hover:bg-teal-300 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 sm:w-auto"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 motion-safe:animate-spin"
            />
          )}
          {loading ? "Finding your anchor…" : "Find my anchor"}
        </button>
        <p id={ids.privacy} className="text-sm leading-relaxed text-slate-400">
          Your text is sent to Google for an AI-generated reflection.{" "}
          {onShowPrivacy && (
            <button
              type="button"
              onClick={onShowPrivacy}
              className={`inline min-h-0 rounded text-teal-300 underline underline-offset-4 hover:text-teal-200 ${focusRing}`}
            >
              Privacy details
            </button>
          )}
        </p>
        {offline && (
          <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-100">
            You&apos;re offline. AI reflections need a connection — the settle exercises still work.
          </p>
        )}
      </div>

      {/* Examples step aside while a request runs, so the loading status sits right under the button. */}
      <details hidden={loading} className="group mt-6 border-t border-slate-800 pt-4">
        <summary
          className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          <span aria-hidden="true" className="transition-transform group-open:rotate-90 motion-reduce:transition-none">
            ▸
          </span>
          Try an example
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.id, preset.text)}
              disabled={loading}
              className={`min-h-11 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-teal-400/60 hover:bg-teal-400/5 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </details>
    </form>
  );
}
