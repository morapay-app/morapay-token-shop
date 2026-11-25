import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstitutionPicker } from "@/components/SellWidget/InstitutionPicker";
import {
  institutionLabel,
  listedInstitutions,
  searchInstitutions,
  type SellInstitution,
} from "@/lib/sell";

const NGN: SellInstitution[] = [
  { code: "044", name: "Access Bank", kind: "bank" },
  { code: "090267", name: "Kuda Microfinance Bank", kind: "bank" },
  { code: "058", name: "Guaranty Trust Bank (058)", kind: "bank" },
  { code: "100004", name: "Paycom (Opay)", kind: "bank" },
];
const GHS: SellInstitution[] = [
  { code: "0004", name: "MTN", kind: "mobile_money" },
  { code: "0006", name: "VODAFONE", kind: "mobile_money" },
  { code: "090100", name: "Société Générale Ghana Limited", kind: "bank" },
];

beforeAll(() => {
  // jsdom has no layout, so scrolling is a no-op.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function Harness({ list, onChange }: { list: SellInstitution[]; onChange?: (c: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <InstitutionPicker
      id="bank"
      label="Bank"
      institutions={list}
      value={value}
      onChange={(c) => {
        setValue(c);
        onChange?.(c);
      }}
    />
  );
}

async function openPicker(list: SellInstitution[], onChange?: (c: string) => void) {
  const user = userEvent.setup();
  const view = render(<Harness list={list} onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /Bank/ }));
  return { user, ...view, dialog: screen.getByRole("dialog", { name: "Bank" }) };
}

const shown = () => screen.getAllByRole("option").map((o) => o.textContent);

describe("searchInstitutions", () => {
  it("ignores case, diacritics and word order", () => {
    expect(searchInstitutions(GHS, "societe GENERALE").map((i) => i.code)).toEqual(["090100"]);
    expect(searchInstitutions(GHS, "générale société").map((i) => i.code)).toEqual(["090100"]);
    expect(searchInstitutions(NGN, "  ").length).toBe(NGN.length);
    expect(searchInstitutions(NGN, "zzz")).toEqual([]);
  });

  it("finds a network by its shown or issued name", () => {
    expect(searchInstitutions(GHS, "momo").map((i) => i.code)).toEqual(["0004"]);
    expect(searchInstitutions(GHS, "telecel").map((i) => i.code)).toEqual(["0006"]);
    expect(searchInstitutions(GHS, "vodafone").map((i) => i.code)).toEqual(["0006"]);
  });

  it("does not search by code", () => {
    for (const i of [...NGN, ...GHS]) expect(searchInstitutions([i], i.code)).toEqual([]);
  });
});

describe("institutionLabel", () => {
  it("drops a code wherever the rail put it", () => {
    for (const name of ["GTBank (058)", "GTBank [058]", "GTBank - 058", "058 - GTBank", "058 GTBank"]) {
      expect(institutionLabel({ code: "058", name, kind: "bank" })).toBe("GTBank");
    }
  });

  it("names Ghana networks clearly", () => {
    for (const name of ["MTN", "mtn", "MTN Mobile Money", "MTN (0004)", "MTN MoMo"]) {
      expect(institutionLabel({ code: "0004", name, kind: "mobile_money" })).toBe("MTN MoMo");
    }
  });

  it("keeps numbers that belong to a bank's name", () => {
    expect(institutionLabel({ code: "120001", name: "9 Payment Service Bank", kind: "bank" })).toBe(
      "9 Payment Service Bank",
    );
  });
});

describe("listedInstitutions", () => {
  it("leaves out provider-run banks and code-only entries", () => {
    const list = [
      ...NGN,
      { code: "100039", name: "Titan-Paystack", kind: "bank" },
      { code: "300457", name: "Paystack Limited", kind: "bank" },
      { code: "999", name: "999", kind: "bank" },
    ];
    expect(listedInstitutions(list)).toEqual(NGN);
  });
});

describe("InstitutionPicker", () => {
  it("filters as you type and picks by click", async () => {
    const onChange = vi.fn();
    const { user, dialog } = await openPicker(NGN, onChange);
    const search = within(dialog).getByRole("combobox", { name: "Search bank" });
    expect(search).toHaveFocus();
    await user.type(search, "KUDA");
    expect(shown()).toEqual(["Kuda Microfinance Bank"]);
    await user.click(screen.getByRole("option"));
    expect(onChange).toHaveBeenCalledWith("090267");
    expect(screen.queryByRole("dialog")).toBeNull();
    const trigger = screen.getByRole("button", { name: /Kuda Microfinance Bank/ });
    expect(trigger).toHaveFocus();
  });

  it("moves with the arrow keys, wraps, and picks with Enter", async () => {
    const onChange = vi.fn();
    const { user } = await openPicker(NGN, onChange);
    const search = screen.getByRole("combobox");
    await user.keyboard("{ArrowDown}");
    expect(search).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1].id);
    await user.keyboard("{ArrowUp}{ArrowUp}{Enter}");
    expect(onChange).toHaveBeenCalledWith("100004");
  });

  it("closes on Escape without picking and returns focus", async () => {
    const onChange = vi.fn();
    const { user } = await openPicker(NGN, onChange);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Bank/ })).toHaveFocus();
  });

  it("keeps Tab inside the sheet", async () => {
    const { user, dialog } = await openPicker(NGN);
    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("says when nothing matches, and Enter picks nothing", async () => {
    const onChange = vi.fn();
    const { user } = await openPicker(NGN, onChange);
    await user.type(screen.getByRole("combobox"), "nothing{Enter}");
    expect(screen.queryAllByRole("option")).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent("No match");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("groups GHS networks before banks, by name", async () => {
    await openPicker(GHS);
    expect(shown()).toEqual([
      "MTN MoMo",
      "Telecel Cash (Vodafone)",
      "Société Générale Ghana Limited",
    ]);
    expect(screen.getByRole("group", { name: "Mobile money" })).toBeInTheDocument();
  });

  it.each([["NGN", NGN], ["GHS", GHS]])("puts no code in the %s page at all", async (_c, list) => {
    const { user, baseElement } = await openPicker(list);
    const codes = list.map((i) => i.code);
    for (const code of codes) expect(baseElement.innerHTML).not.toContain(code);
    await user.keyboard("{Enter}");
    for (const code of codes) expect(baseElement.innerHTML).not.toContain(code);
  });
});
