"use client";

import { useActionState, useEffect, useRef } from "react";
import { addShoppingItem } from "@/app/actions";
import { FormError } from "@/components/Submit";

export function QuickAdd({ compact = false, suggestions = [] }: { compact?: boolean; suggestions?: string[] }) {
  const [state, action, pending] = useActionState(addShoppingItem, undefined);
  const form = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <div className="space-y-2">
      <form ref={form} action={action} className="flex gap-2">
        <input
          ref={nameRef}
          name="name"
          className="input flex-1"
          placeholder={compact ? "Lisää ostoslistalle…" : "Mitä pitää ostaa?"}
          list={suggestions.length ? "shopping-suggestions" : undefined}
          autoComplete="off"
          enterKeyHint="done"
          required
        />
        {!compact && <input name="quantity" className="input w-20" placeholder="Määrä" autoComplete="off" />}
        <button className="btn aspect-square px-0 text-2xl" style={{ width: 48 }} disabled={pending} aria-label="Lisää">
          +
        </button>
      </form>
      {suggestions.length > 0 && (
        <datalist id="shopping-suggestions">
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      <FormError state={state} />
    </div>
  );
}

export function SuggestionChips({ suggestions }: { suggestions: string[] }) {
  const [, action, pending] = useActionState(addShoppingItem, undefined);
  if (!suggestions.length) return null;
  return (
    <div>
      <div className="label">Usein ostetut</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 12).map((s) => (
          <form key={s} action={action}>
            <input type="hidden" name="name" value={s} />
            <button disabled={pending} className="rounded-full border-2 border-line bg-white px-3 py-1 text-sm font-bold active:bg-brand-soft">
              + {s}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
