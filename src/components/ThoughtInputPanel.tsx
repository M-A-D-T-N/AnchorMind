"use client";

import { useCallback, useId, useState, type FormEvent, type Ref } from "react";
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
  textareaRef?: Ref<HTMLTextAreaElement>;
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

export default function ThoughtInputPanel({ value, onChange, onSubmit, loading, textareaRef }: ThoughtInputPanelProps) {
  const ids = { field: useId(), error: useId(), count: useId(), privacy: useId() };
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFinalSpeech = useCallback(
    (text: string) => {
      onChange(appendTranscript(value, text));
    },
    [onChange, value],
  );
  const speech = useSpeechRecognition(handleFinalSpeech);

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
      <label htmlFor={ids.field} className="block text-base font-medium text-slate-100">
        What&apos;s on your mind?
      </label>

      {/* Textarea with its tools attached, so dictation and the count read as part of the field. */}
      <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950/60 transition-colors focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/30 has-[textarea[aria-invalid=true]]:border-amber-400">
        <textarea
          id={ids.field}
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (validationError) setValidationError(null);
          }}
          rows={4}
          disabled={loading}
          placeholder="Write it the way it sounds in your head — for example, “What if I mess this up and everyone notices?”"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={`${ids.count} ${ids.privacy}${shownError ? ` ${ids.error}` : ""}`}
          className="block w-full resize-y rounded-t-xl bg-transparent px-4 pt-3 pb-2 text-base leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-2 py-1.5">
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={loading || !speech.supported}
            aria-pressed={speech.listening}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-teal-500/15 aria-pressed:text-teal-200 ${focusRing}`}
          >
            {speech.listening ? <StopIcon width={18} height={18} /> : <MicIcon width={18} height={18} />}
            {speech.listening ? "Stop dictation" : "Dictate"}
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
          <p className="text-teal-300" role="status">
            Listening… speak naturally, then press stop.
          </p>
        )}
        {speech.error && (
          <p role="alert" className="text-amber-300">
            {speech.error}
          </p>
        )}
        <p className="text-xs leading-relaxed text-slate-400">
          {speech.supported
            ? "Dictation uses your browser's speech recognition, which may send audio to an outside provider such as your browser vendor."
            : "Voice input isn't available in this browser — typing works just as well."}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-400 px-7 text-base font-semibold text-slate-950 transition-colors hover:bg-teal-300 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 motion-safe:animate-spin"
            />
          )}
          {loading ? "Finding your anchor…" : "Find my anchor"}
        </button>
        <p id={ids.privacy} className="text-xs leading-relaxed text-slate-400">
          Live analysis sends your text to Google&apos;s Gemini API, under Google&apos;s terms. AnchorMind
          doesn&apos;t save your thoughts or reflections.
        </p>
      </div>

      {/* Examples step aside while a request runs, so the loading status sits right under the button. */}
      <fieldset hidden={loading} className="mt-6 border-t border-slate-800 pt-5">
        <legend className="sr-only">Try an example</legend>
        <p aria-hidden="true" className="mb-2.5 text-sm text-slate-400">
          Not sure where to start? Try an example:
        </p>
        <div className="flex flex-wrap gap-2">
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
      </fieldset>
    </form>
  );
}
