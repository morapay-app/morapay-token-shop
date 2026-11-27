import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TokenPicker } from "@/components/TokenPicker";

const PI = { ticker: "PI", label: "PI", logo: "/brand/pi/logo.svg", chainName: "Pi Network" };
const PCM = {
  ticker: "PCM",
  label: "PCM · OP",
  logo: "/brand/pi/pcm.png",
  chainName: "Optimism",
  hint: "ERC-20 on Optimism. Use a 0x wallet on Optimism, not a Pi wallet.",
};

afterEach(cleanup);

describe("TokenPicker", () => {
  it("renders nothing for a single-token shop", () => {
    const { container } = render(<TokenPicker id="t" tokens={[PI]} value="PI" onChange={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows PI first, marks the active token, and puts details in a tooltip", async () => {
    const onChange = vi.fn();
    render(<TokenPicker id="t" tokens={[PI, PCM]} value="PI" onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["PI", "PCM · OP"]);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("title", PCM.hint);
    expect(screen.getByText("On Pi Network")).toBeInTheDocument();
    await userEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalledWith("PCM");
  });

  it("lets a coming-soon token be picked for a price, still marked soon", async () => {
    const onChange = vi.fn();
    const soon = { ...PI, comingSoon: true };
    const { rerender } = render(<TokenPicker id="t" tokens={[soon, PCM]} value="PCM" onChange={onChange} />);
    const [piRadio] = screen.getAllByRole("radio");
    expect(piRadio).toHaveTextContent("PI· soon");
    expect(piRadio).not.toBeDisabled();
    expect(piRadio).toHaveAttribute("title", "PI is coming soon. Quotes only for now.");
    await userEvent.click(piRadio!);
    expect(onChange).toHaveBeenCalledWith("PI");
    rerender(<TokenPicker id="t" tokens={[soon, PCM]} value="PI" onChange={onChange} />);
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true");
  });
});

