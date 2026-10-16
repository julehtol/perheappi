"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { approveWish, createWish, saveMeal, toggleWishVote } from "@/app/actions";
import { SlotPicker } from "@/components/SlotPicker";
import { FormError, Submit } from "@/components/Submit";
import type { MealSlot } from "@/lib/types";

type RecipeOpt = { id: number; title: string; emoji: string };

export function AddMeal({ date, recipes, hasMeal, defaultSlot }: { date: string; recipes: RecipeOpt[]; hasMeal: boolean; defaultSlot: MealSlot }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveMeal, undefined);
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className={`mt-1 text-sm font-bold ${hasMeal ? "text-muted" : "text-brand-dark"}`}>
        {hasMeal ? (defaultSlot === "paiva" ? "+ Lisää päiväruoka" : "+ lisää toinen") : "+ Lisää ruoka"}
      </button>
    );
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="date" value={date} />
      <SlotPicker defaultSlot={defaultSlot} />
      <input name="title" className="input" placeholder="Ruoan nimi" autoFocus />
      {recipes.length > 0 && (
        <select name="recipe_id" className="input" defaultValue="">
          <option value="">…tai valitse resepti</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.title}</option>)}
        </select>
      )}
      <input name="note" className="input" placeholder="Lisätieto (esim. mummo tulee kylään)" />
      <FormError state={state} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Peru</button>
        <Submit className="btn btn-sm flex-1">Tallenna</Submit>
      </div>
    </form>
  );
}

export function WishForm({ recipes }: { recipes: RecipeOpt[] }) {
  const [state, action] = useActionState(createWish, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="card space-y-2 bg-grape-soft p-4">
      <div className="font-black">🙋 Mitä haluaisit syödä?</div>
      <input name="title" className="input" placeholder="esim. Tacot, lettuja, lohikeitto…" />
      {recipes.length > 0 && (
        <select name="recipe_id" className="input" defaultValue="">
          <option value="">…tai valitse reseptikirjasta</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.title}</option>)}
        </select>
      )}
      <input name="note" className="input" placeholder="Perustelu (vapaaehtoinen) 😇" />
      <FormError state={state} />
      {state?.ok && <p className="text-sm font-bold text-leaf">Toive lähetetty! 🚀</p>}
      <Submit className="btn w-full">Lähetä toive</Submit>
    </form>
  );
}

export function VoteButton({ wishId, voted, count }: { wishId: number; voted: boolean; count: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => toggleWishVote(wishId))}
      disabled={pending}
      className={`flex flex-col items-center rounded-2xl px-3 py-1.5 font-black transition ${voted ? "bg-brand text-white" : "bg-cream text-ink"}`}
      aria-pressed={voted}
      aria-label="Peukku"
    >
      <span className="text-xl">👍</span>
      <span className="text-sm">{count}</span>
    </button>
  );
}

export function ApproveWish({ wishId, defaultDate }: { wishId: number; defaultDate: string }) {
  const [state, action] = useActionState(approveWish, undefined);
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={wishId} />
      <input type="date" name="date" defaultValue={defaultDate} className="input w-auto flex-1 py-2" required />
      <Submit className="btn btn-green btn-sm">✓ Hyväksy</Submit>
      <div className="w-full"><SlotPicker /></div>
      <div className="w-full"><FormError state={state} /></div>
    </form>
  );
}
