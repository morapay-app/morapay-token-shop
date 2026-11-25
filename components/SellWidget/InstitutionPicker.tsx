"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { institutionLabel, searchInstitutions, type SellInstitution } from "@/lib/sell";

type Props = {
  id: string;
  /** "Bank" or "Network or bank"; also titles the sheet. */
  label: string;
  institutions: SellInstitution[];
  /** Selected institution code, or "". */
  value: string;
  onChange: (code: string) => void;
};

const GROUPS = [
  { kind: "mobile_money", title: "Mobile money" },
  { kind: "bank", title: "Banks" },
] as const;

function groupOf(i: SellInstitution) {
  return i.kind === "mobile_money" ? "mobile_money" : "bank";
}

/** Searchable bank / network sheet. Shows names only; codes never reach the page. */
export function InstitutionPicker({ id, label, institutions, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = institutions.find((i) => i.code === value);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      <span id={`${id}-label`} className="label">
        {label}
      </span>
      <button
        ref={trigger}
        id={id}
        type="button"
        className="field text-left truncate"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        disabled={institutions.length === 0}
        onClick={() => setOpen(true)}
      >
        {selected ? institutionLabel(selected) : "Choose one"}
      </button>
      {open && (
        <PickerSheet
          title={label}
          institutions={institutions}
          value={value}
          onPick={(code) => {
            onChange(code);
            close();
          }}
          onClose={close}
        />
      )}
    </>
  );
}

function PickerSheet({
  title,
  institutions,
  value,
  onPick,
  onClose,
}: {
  title: string;
  institutions: SellInstitution[];
  value: string;
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(() =>
    Math.max(0, institutions.findIndex((i) => i.code === value)),
  );
  const sheet = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const found = searchInstitutions(institutions, query);
    // Options are numbered in the order they are shown.
    return GROUPS.flatMap((g) => found.filter((i) => groupOf(i) === g.kind));
  }, [institutions, query]);
  const groups = GROUPS.filter((g) => matches.some((i) => groupOf(i) === g.kind));
  const active = Math.min(cursor, matches.length - 1);
  const optionId = (index: number) => `${uid}-option-${index}`;

  useEffect(() => {
    input.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    document.getElementById(`${uid}-option-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [uid, active]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") {
      // Keep focus inside the sheet.
      const stops = sheet.current?.querySelectorAll<HTMLElement>("input, button");
      if (!stops?.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onInputKeyDown(e: KeyboardEvent) {
    if (e.nativeEvent.isComposing || matches.length === 0) return;
    const last = matches.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: active >= last ? 0 : active + 1,
      ArrowUp: active <= 0 ? last : active - 1,
      PageDown: Math.min(last, active + 8),
      PageUp: Math.max(0, active - 8),
    };
    if (e.key in moves) {
      e.preventDefault();
      setCursor(moves[e.key]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onPick(matches[active].code);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="picker-sheet card w-full sm:max-w-[440px] flex flex-col"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 id={`${uid}-title`} className="font-heading text-lg font-bold">
            {title}
          </h2>
          <button type="button" className="btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="px-5 pb-3">
          <input
            ref={input}
            type="text"
            inputMode="search"
            enterKeyHint="done"
            className="field"
            placeholder="Search"
            aria-label={`Search ${title.toLowerCase()}`}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={`${uid}-list`}
            aria-activedescendant={matches.length > 0 ? optionId(active) : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div
          id={`${uid}-list`}
          role="listbox"
          aria-label={title}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {groups.map((g) => (
            <div key={g.kind} role="group" aria-label={g.title}>
              {groups.length > 1 && (
                <p
                  aria-hidden="true"
                  className="px-3 pt-2 pb-1 text-xs text-[var(--mp-text-muted)]"
                >
                  {g.title}
                </p>
              )}
              {matches.map((i, index) =>
                groupOf(i) === g.kind ? (
                  // Keyboard use goes through the search box (aria-activedescendant).
                  <div
                    key={i.code}
                    id={optionId(index)}
                    role="option"
                    aria-selected={i.code === value}
                    className="picker-option"
                    data-active={index === active || undefined}
                    onMouseMove={() => {
                      if (index !== active) setCursor(index);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onPick(i.code)}
                  >
                    <span className="truncate">{institutionLabel(i)}</span>
                    {i.code === value && <span aria-hidden="true">✓</span>}
                  </div>
                ) : null,
              )}
            </div>
          ))}
        </div>
        <p role="status" className={matches.length > 0 ? "sr-only" : "px-6 pb-6 text-sm text-[var(--mp-text-muted)]"}>
          {matches.length > 0 ? `${matches.length} found` : "No match"}
        </p>
      </div>
    </div>
  );
}
