import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BREATHING_TOTAL_MS } from "@/components/BreathingPacerGate";
import { DEMO_FIXTURES } from "@/lib/presets";
import type { AnalyzeResponse } from "@/types/analysis";
import Home from "./page";

function jsonResponse(body: AnalyzeResponse, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const THOUGHT_LABEL = "What is your mind telling you right now?";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function openThoughtEntry() {
  fireEvent.click(screen.getByRole("button", { name: /Untangle a thought/ }));
}

function typeAndSubmit(text: string) {
  openThoughtEntry();
  fireEvent.change(screen.getByLabelText(THOUGHT_LABEL), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Find my anchor" }));
}

function clickExample(name: string) {
  openThoughtEntry();
  fireEvent.click(screen.getByText("Try an example"));
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("home", () => {
  it("offers two clear actions and urgent support without any request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    expect(screen.getByRole("heading", { name: "One small step, right now." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Help me settle/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Untangle a thought/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get urgent support" })).toBeInTheDocument();
    // No autofocus on first load (avoids opening a phone keyboard).
    expect(document.activeElement).toBe(document.body);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opens privacy information and returns home", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Privacy & limits" }));
    expect(screen.getByRole("heading", { name: "Privacy & limits" })).toBeInTheDocument();
    expect(screen.getByText(/Crisis detection has limits/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Home/ }));
    expect(screen.getByRole("heading", { name: "One small step, right now." })).toBeInTheDocument();
  });
});

describe("help me settle (no AI)", () => {
  it("home → breathing → stop → completion → home, with no network request", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Help me settle/ }));
    fireEvent.click(screen.getByRole("button", { name: /Follow a breathing rhythm/ }));
    expect(screen.getByRole("heading", { name: "Follow a breathing rhythm" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip and view reflection" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("heading", { name: "You can take another moment, or continue." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Return home" }));
    expect(screen.getByRole("heading", { name: "One small step, right now." })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("manual breathing completes after 42 seconds without opening a result", () => {
    vi.useFakeTimers();
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Help me settle/ }));
    fireEvent.click(screen.getByRole("button", { name: /Follow a breathing rhythm/ }));
    act(() => {
      vi.advanceTimersByTime(BREATHING_TOTAL_MS + 500);
    });
    expect(screen.getByRole("heading", { name: "You can take another moment, or continue." })).toBeInTheDocument();
    expect(screen.queryByText("Your reflection")).not.toBeInTheDocument();
  });

  it("home → grounding → finish → untangle a thought", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Help me settle/ }));
    fireEvent.click(screen.getByRole("button", { name: /Focus on what you can feel/ }));
    expect(screen.getByText(/Notice where they make contact/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start 60-second timer" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    fireEvent.click(screen.getByRole("button", { name: "Untangle a thought" }));
    expect(screen.getByLabelText(THOUGHT_LABEL)).toBeInTheDocument();
  });
});

describe("thought flow", () => {
  it("shows crisis support immediately, never the breathing gate or analysis", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ kind: "crisis", source: "gemini" })));
    render(<Home />);
    typeAndSubmit("something");
    expect(await screen.findByRole("heading", { name: /may need support right now/ })).toBeInTheDocument();
    expect(screen.queryByText(/slow things down/)).not.toBeInTheDocument();
    expect(screen.queryByText("Possible thought pattern")).not.toBeInTheDocument();
    expect(screen.queryByText("A steadier perspective")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /findahelpline/ })).toHaveAttribute("href", "https://findahelpline.com");
  });

  it("score 8+ opens the breathing gate and hides results until skip", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ kind: "analysis", source: "demo", result: DEMO_FIXTURES.exam })));
    render(<Home />);
    clickExample("Exam & Presentation Spiral");
    expect(await screen.findByText(/slow things down/)).toBeInTheDocument();
    expect(screen.queryByText("A steadier perspective")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip and view reflection" }));
    expect(screen.getByText("A steadier perspective")).toBeInTheDocument();
    expect(screen.getByText("Catastrophizing")).toBeInTheDocument();
  });

  it("score 7 skips the gate and leads with the reframe and one action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ kind: "analysis", source: "demo", result: DEMO_FIXTURES.ocd })));
    render(<Home />);
    clickExample("OCD Checking Loop");
    expect(await screen.findByText("A steadier perspective")).toBeInTheDocument();
    expect(screen.getByText("One thing to try now")).toBeInTheDocument();
    expect(screen.getByText("Demo example")).toBeInTheDocument();
    expect(screen.queryByText(/slow things down/)).not.toBeInTheDocument();
    // Details are behind "Look at the thought".
    const details = screen.getByText("Look at the thought").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByText("You wrote")).toBeInTheDocument();
  });

  it("sends the exact preset text and id for each example", async () => {
    for (const [name, id] of [
      ["Exam & Presentation Spiral", "exam"],
      ["OCD Checking Loop", "ocd"],
      ["Social Message Overthink", "social"],
    ] as const) {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ kind: "analysis", source: "demo", result: DEMO_FIXTURES.social }));
      vi.stubGlobal("fetch", fetchMock);
      const { unmount } = render(<Home />);
      clickExample(name);
      await screen.findByText("A steadier perspective");
      const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as { demoPresetId: string };
      expect(body.demoPresetId).toBe(id);
      unmount();
    }
  });

  it("keeps text after an error and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ kind: "error", error: { code: "timeout", message: "Took too long.", retryable: true } }, 504))
      .mockResolvedValueOnce(jsonResponse({ kind: "analysis", source: "gemini", result: DEMO_FIXTURES.social }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    typeAndSubmit("my thought");
    expect(await screen.findByText("Took too long.")).toBeInTheDocument();
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("my thought");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("AI-generated reflection")).toBeInTheDocument();
  });

  it("hides Retry for non-retryable errors such as a missing API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ kind: "error", error: { code: "not_configured", message: "Not set up.", retryable: false } }, 503)),
    );
    render(<Home />);
    typeAndSubmit("custom");
    expect(await screen.findByText("Not set up.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("ignores a late response after cancel", async () => {
    let resolveFetch: (r: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((resolve) => (resolveFetch = resolve))));
    render(<Home />);
    typeAndSubmit("slow one");
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await act(async () => {
      resolveFetch(jsonResponse({ kind: "analysis", source: "gemini", result: DEMO_FIXTURES.social }));
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Find my anchor" })).toBeEnabled());
    expect(screen.queryByText("A steadier perspective")).not.toBeInTheDocument();
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("slow one");
  });

  it("opening urgent support during loading blocks a late result from replacing it", async () => {
    let resolveFetch: (r: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((resolve) => (resolveFetch = resolve))));
    render(<Home />);
    typeAndSubmit("slow one");
    await screen.findByRole("button", { name: "Cancel" });
    fireEvent.click(screen.getByRole("button", { name: "Get urgent support" }));
    await act(async () => {
      resolveFetch(jsonResponse({ kind: "analysis", source: "gemini", result: DEMO_FIXTURES.exam }));
    });
    expect(screen.getByRole("heading", { name: "Get urgent support" })).toBeInTheDocument();
    expect(screen.queryByText(/slow things down/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("slow one");
  });

  it("back to home preserves the draft", () => {
    render(<Home />);
    openThoughtEntry();
    fireEvent.change(screen.getByLabelText(THOUGHT_LABEL), { target: { value: "draft words" } });
    fireEvent.click(screen.getByRole("button", { name: /Home/ }));
    openThoughtEntry();
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("draft words");
  });

  it("start a new reflection clears the draft; return home is available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ kind: "analysis", source: "gemini", result: DEMO_FIXTURES.social })));
    render(<Home />);
    typeAndSubmit("first thought");
    await screen.findByText("A steadier perspective");
    expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start a new reflection" }));
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("");
  });

  it("offline: no request is sent, the draft is kept, and the settle tools are suggested", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<Home />);
    typeAndSubmit("offline thought");
    expect(await screen.findByText(/You're offline, so an AI reflection isn't available/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(THOUGHT_LABEL)).toHaveValue("offline thought");
    onLine.mockRestore();
  });

  it("urgent support opens from home without any API call", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Get urgent support" }));
    expect(screen.getByRole("heading", { name: "Get urgent support" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "One small step, right now." })).toBeInTheDocument();
  });
});
