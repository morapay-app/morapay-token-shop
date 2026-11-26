import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CancelOrder } from "@/components/CancelOrder";
import { orderCancelStorageKey } from "@/lib/order-cancel-copy";

const PAID = "Payment already received; this order can't be cancelled";

beforeEach(() => {
  // jsdom has no modal dialog: open/close by the attribute.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
  localStorage.setItem(
    orderCancelStorageKey("R1"),
    JSON.stringify({ token: "t".repeat(40), openedAt: Date.now() - 11 * 60_000, direction: "buy" }),
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function stubFetch(cancel: Response) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
    String(url).endsWith("/cancel")
      ? cancel
      : new Response(JSON.stringify({ success: true, data: { phase: "in_progress", cancellable: true } })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CancelOrder", () => {
  it("asks first, keeps the order on 'Keep order', and cancels only on confirm", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ success: true, data: { ref: "R1", phase: "cancelled" } })));
    const onCancelled = vi.fn();
    await act(async () => {
      render(<CancelOrder orderRef="R1" onCancelled={onCancelled} />);
    });
    fireEvent.click(await screen.findByRole("button", { name: "Cancel onramp" }));
    expect(screen.getByText("Cancel this onramp?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep order" }));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/cancel"))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Cancel onramp" }));
    const confirm = screen.getAllByRole("button", { name: "Cancel onramp", hidden: true }).at(-1)!;
    await act(async () => {
      fireEvent.click(confirm);
    });
    const cancelCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/cancel"))!;
    expect(JSON.parse(String(cancelCall[1]?.body))).toEqual({ token: "t".repeat(40) });
    expect(onCancelled).toHaveBeenCalledOnce();
  });

  it("shows Core's refusal line and does not report a cancel", async () => {
    stubFetch(new Response(JSON.stringify({ success: false, message: PAID }), { status: 409 }));
    const onCancelled = vi.fn();
    await act(async () => {
      render(<CancelOrder orderRef="R1" onCancelled={onCancelled} />);
    });
    fireEvent.click(await screen.findByRole("button", { name: "Cancel onramp" }));
    const confirm = screen.getAllByRole("button", { name: "Cancel onramp", hidden: true }).at(-1)!;
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(await screen.findByText(PAID)).toBeTruthy();
    expect(onCancelled).not.toHaveBeenCalled();
  });

  it("shows nothing on a device without the order's token, or before 10 minutes", async () => {
    stubFetch(new Response("{}"));
    localStorage.clear();
    const { container, unmount } = render(<CancelOrder orderRef="R1" onCancelled={() => {}} />);
    expect(container.innerHTML).toBe("");
    unmount();
    localStorage.setItem(orderCancelStorageKey("R1"), JSON.stringify({ token: "t".repeat(40), openedAt: Date.now(), direction: "sell" }));
    const second = render(<CancelOrder orderRef="R1" onCancelled={() => {}} />);
    expect(second.container.innerHTML).toBe("");
  });
});
