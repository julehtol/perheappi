"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { approveWish, createWish, deleteMeal, saveMeal, toggleWishVote } from "@/app/actions";
import { CookBadge, CookPicker, type MemberLite } from "@/components/CookPicker";
import { SlotPicker } from "@/components/SlotPicker";
import { FormError, Submit } from "@/components/Submit";
import { SLOT_SHORT } from "@/lib/meals";
import type { Meal, MealSlot } from "@/lib/types";

type RecipeOpt = { id: number; title: string; emoji: string };

function MealForm({
  date,
  recipes,
  members,
  defaultSlot,
  meal,
  onDone,
}: {
  date: string;
  recipes: RecipeOpt[];
  members: MemberLite[];
  defaultSlot: MealSlot;
  meal?: Meal;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveMeal, undefined);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="mt-2 space-y-3 rounded-2xl bg-cream p-3">
      {meal && <input type="hidden" name="id" value={meal.id} />}
      <input type="hidden" name="date" value={date} />
      <SlotPicker defaultSlot={meal?.slot ?? defaultSlot} />
      <input name="title" className="input" placeholder="Ruoan nimi" defaultValue={meal?.title} autoFocus={!meal} />
      {recipes.length > 0 && (
        <select name="recipe_id" className="input" defaultValue={meal?.recipe_id ?? ""}>
          <option value="">{meal ? "Ei reseptiä" : "…tai valitse resepti"}</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.title}</option>)}
        </select>
      )}
      <CookPicker members={members} defaultValue={meal?.cook_id} />
      <input name="note" className="input" placeholder="Lisätieto (esim. mummo tulee kylään)" defaultValue={meal?.note ?? ""} />
      <FormError state={state} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={onDone}>Peru</button>
        <Submit className="btn btn-sm flex-1">Tallenna</Submit>
      </div>
    </form>
  );
}

export function AddMeal(props: { date: string; recipes: RecipeOpt[]; members: MemberLite[]; hasMeal: boolean; defaultSlot: MealSlot }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className={`mt-1 text-sm font-bold ${props.hasMeal ? "text-muted" : "text-brand-dark"}`}>
        {props.hasMeal ? (props.defaultSlot === "paiva" ? "+ Lisää päiväruoka" : "+ Lisää iltaruoka") : "+ Lisää ruoka"}
      </button>
    );
  return <MealForm {...props} onDone={() => setOpen(false)} />;
}

/** Ruokalistan rivi: päivä/ilta, ruoka ja tekijä. Vanhempi voi muokata ja poistaa. */
export function MealItem({
  meal,
  recipeEmoji,
  cook,
  canEdit,
  recipes,
  members,
}: {
  meal: Meal;
  recipeEmoji?: string;
  cook?: MemberLite | null;
  canEdit: boolean;
  recipes: RecipeOpt[];
  members: MemberLite[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="py-1.5">
      <div className="flex items-start gap-2">
        <span className="mt-1 w-16 shrink-0 text-xs font-black text-muted">{SLOT_SHORT[meal.slot]}</span>
        <div className="min-w-0 flex-1">
          {meal.recipe_id ? (
            <Link href={`/reseptit/${meal.recipe_id}`} className="text-lg font-black leading-tight">
              {recipeEmoji ?? "🍽️"} {meal.title} <span className="text-sm text-brand-dark">📖</span>
            </Link>
          ) : (
            <span className="text-lg font-black leading-tight">{meal.title}</span>
          )}
          <div className="flex flex-wrap items-center gap-x-3">
            <CookBadge cook={cook} />
            {meal.wish_id && <span className="text-xs font-bold text-grape">🙋 toive</span>}
          </div>
          {meal.note && <div className="text-sm text-muted">{meal.note}</div>}
        </div>
        {canEdit && !editing && (
          <div className="flex shrink-0">
            <button className="px-1.5 text-muted" aria-label="Muokkaa" onClick={() => setEditing(true)}>✏️</button>
            <form action={deleteMeal}>
              <input type="hidden" name="id" value={meal.id} />
              <button className="px-1.5 text-lg text-muted" aria-label="Poista">×</button>
            </form>
          </div>
        )}
      </div>
      {editing && (
        <MealForm date={meal.date} recipes={recipes} members={members} defaultSlot={meal.slot} meal={meal} onDone={() => setEditing(false)} />
      )}
    </div>
  );
}

export function WishForm({ recipes, members }: { recipes: RecipeOpt[]; members: MemberLite[] }) {
  const [state, action] = useActionState(createWish, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="card space-y-3 bg-grape-soft p-4">
      <div className="font-black">🙋 Mitä haluaisit syödä?</div>
      <input name="title" className="input" placeholder="esim. Tacot, lettuja, lohikeitto…" />
      {recipes.length > 0 && (
        <select name="recipe_id" className="input" defaultValue="">
          <option value="">…tai valitse reseptikirjasta</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.title}</option>)}
        </select>
      )}
      <CookPicker members={members} label="👩‍🍳 Kuka tekee? (valitse itsesi, jos teet itse)" />
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

export function ApproveWish({ wishId, defaultDate, members, cookId }: { wishId: number; defaultDate: string; members: MemberLite[]; cookId: number | null }) {
  const [state, action] = useActionState(approveWish, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={wishId} />
      <div className="flex gap-2">
        <input type="date" name="date" defaultValue={defaultDate} className="input w-auto flex-1 py-2" required />
        <Submit className="btn btn-green btn-sm">✓ Hyväksy</Submit>
      </div>
      <SlotPicker />
      <CookPicker members={members} defaultValue={cookId} />
      <FormError state={state} />
    </form>
  );
}
