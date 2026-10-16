"use client";

import { useOptimistic, useState, useTransition } from "react";
import { clearDoneShopping, deleteShoppingItem, setShoppingCategory, toggleShoppingItem } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { CATEGORIES, categoryInfo } from "@/lib/categories";
import type { Member, ShoppingItem } from "@/lib/types";

type MemberLite = Pick<Member, "id" | "name" | "emoji" | "color">;

export function ShoppingList({ items, members }: { items: ShoppingItem[]; members: MemberLite[] }) {
  const [, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(items, (state, { id, done }: { id: number; done: boolean }) =>
    state.map((i) => (i.id === id ? { ...i, done } : i)),
  );
  const [menu, setMenu] = useState<number | null>(null);
  const byId = new Map(members.map((m) => [m.id, m]));

  const open = optimistic.filter((i) => !i.done);
  const done = optimistic.filter((i) => i.done);
  const groups = CATEGORIES.map((c) => ({ c, items: open.filter((i) => categoryInfo(i.category).key === c.key) })).filter((g) => g.items.length);

  const toggle = (id: number, value: boolean) =>
    start(async () => {
      setOptimistic({ id, done: value });
      if (value && navigator.vibrate) navigator.vibrate(15);
      await toggleShoppingItem(id, value);
    });

  if (!optimistic.length) {
    return (
      <div className="card p-8 text-center">
        <div className="text-5xl">🎉</div>
        <p className="mt-2 font-bold">Ostoslista on tyhjä!</p>
        <p className="text-sm text-muted">Lisää tuotteita yllä olevalla kentällä.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(({ c, items }) => (
        <section key={c.key}>
          <h2 className="label flex items-center gap-1">
            <span className="text-base">{c.emoji}</span> {c.label}
          </h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {items.map((i) => (
              <li key={i.id}>
                <div className="flex items-center">
                  <button onClick={() => toggle(i.id, true)} className="flex flex-1 items-center gap-3 px-4 py-3 text-left">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line" />
                    <span className="flex-1 text-lg font-bold leading-tight">
                      {i.name}
                      {i.quantity && <span className="ml-2 text-sm font-semibold text-muted">{i.quantity}</span>}
                    </span>
                    {i.added_by && <Avatar member={byId.get(i.added_by)} size={24} />}
                  </button>
                  <button onClick={() => setMenu(menu === i.id ? null : i.id)} className="px-3 py-3 text-xl text-muted" aria-label="Lisää toimintoja">
                    ⋯
                  </button>
                </div>
                {menu === i.id && (
                  <div className="flex flex-wrap items-center gap-2 bg-cream px-4 py-3">
                    <select
                      className="input w-auto flex-1 py-2 text-sm"
                      defaultValue={categoryInfo(i.category).key}
                      onChange={(e) => {
                        setMenu(null);
                        start(() => setShoppingCategory(i.id, e.target.value));
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-ghost btn-sm text-berry"
                      onClick={() => {
                        setMenu(null);
                        start(() => deleteShoppingItem(i.id));
                      }}
                    >
                      Poista
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="label">✅ Ostettu ({done.length})</h2>
            <button className="text-sm font-bold text-brand-dark" onClick={() => start(() => clearDoneShopping())}>
              Tyhjennä ostetut
            </button>
          </div>
          <ul className="card divide-y divide-line">
            {done.map((i) => (
              <li key={i.id}>
                <button onClick={() => toggle(i.id, false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left opacity-60">
                  <span className="pop grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf text-sm text-white">✓</span>
                  <span className="flex-1 font-semibold line-through">{i.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
