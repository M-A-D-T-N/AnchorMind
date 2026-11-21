"use client";

import { useEffect, useRef } from "react";
import { useElapsedTimer } from "@/lib/useElapsedTimer";

export const GROUNDING_MS = 60_000;

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400";
const secondaryButton = `min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:border-teal-400/60 ${focusRing}`;

export interface GroundingTimerProps {
  /** Label for the control that returns the timer to the start. */
  resetLabel?: "Reset" | "Restart";
  /** Called once each time the timer reaches 60 seconds. */
  onComplete?: () => void;
}

/** Optional 60-second timer. Drift-free; cleans up on unmount; state survives rerenders. */
export default function GroundingTimer({ resetLabel = "Reset", onComplete }: GroundingTimerProps) {
  const timer = useElapsedTimer(GROUNDING_MS);
  const remaining = Math.max(Math.ceil((GROUNDING_MS - timer.elapsedMs) / 1000), 0);
  const display = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const done = timer.status === "done";
  const completeRef = useRef(onComplete);
  const firedRef = useRef(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (timer.status !== "done") {
      firedRef.current = false; // A reset re-arms completion.
    } else if (!firedRef.current) {
      firedRef.current = true;
      completeRef.current?.();
    }
  }, [timer.status]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-14 text-2xl font-light tabular-nums text-slate-100" aria-hidden="true">
          {display}
        </span>
        <span className="sr-only">{done ? "Timer finished" : `${remaining} seconds remaining`}</span>
        {timer.status === "idle" && (
          <button
            type="button"
            onClick={timer.start}
            className={`min-h-11 rounded-xl border border-teal-400/60 px-5 text-sm font-semibold text-teal-100 hover:bg-teal-400/10 ${focusRing}`}
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
            {resetLabel}
          </button>
        )}
      </div>
      <p role="status" className="min-h-5 text-sm text-teal-200">
        {done ? "That’s a minute. Notice how you’re doing right now, whatever that is." : ""}
      </p>
    </div>
  );
}
