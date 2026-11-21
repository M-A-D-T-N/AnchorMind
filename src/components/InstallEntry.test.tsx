import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InstallEntry, { installInstructions } from "./InstallEntry";

describe("installInstructions", () => {
  it("gives browser-appropriate guidance", () => {
    expect(installInstructions("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari")).toMatch(/Add to Home Screen/);
    expect(installInstructions("Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile")).toMatch(/Install app/);
    expect(installInstructions("Mozilla/5.0 (Windows NT 10.0; rv:140.0) Gecko/20100101 Firefox/140.0")).toMatch(/bookmark/);
  });
});

describe("InstallEntry", () => {
  it("shows manual instructions when no native prompt is available", () => {
    render(<InstallEntry />);
    const button = screen.getByRole("button", { name: "Install AnchorMind" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/install|bookmark|Home Screen/i, { selector: "p" })).toBeInTheDocument();
  });

  it("uses the browser's native prompt when offered, without claiming success", async () => {
    render(<InstallEntry />);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Install AnchorMind" }));
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/added to this device/)).not.toBeInTheDocument();

    // Only the browser's own `appinstalled` event confirms installation.
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(screen.getByText(/added to this device/)).toBeInTheDocument();
  });
});
