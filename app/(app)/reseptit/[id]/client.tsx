"use client";

import { useActionState, useState, useTransition } from "react";
import { addIngredientsToShopping, createWish, saveMeal } from "@/app/actions";
import { SlotPicker } from "@/components/SlotPicker";
import { FormError, Submit } from "@/components/Submit";

export function Ingredients({ lines, title }: { lines: string[]; title: string }) {
  const [checked, setChecked] = useState<boolean[]>(() => lines.map(() => true));
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const count = checked.filter(Boolean).length;

  return (
    <section className="card p-4">
      <h2 className="mb-2 text-lg font-black">🧺 Ainekset</h2>
      <ul className="space-y-1">
        {lines.map((l, i) => (
          <li key={i}>
            <label className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={checked[i]}
                onChange={(e) => setChecked((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
              />
              <span className={checked[i] ? "" : "text-muted"}>{l}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        className="btn btn-green mt-3 w-full"
        disabled={pending || count === 0}
        onClick={() =>
          start(async () => {
            const n = await addIngredientsToShopping(lines.filter((_, i) => checked[i]), title);
            setResult(n ? `Lisätty ${n} tuotetta ostoslistalle 🛒` : "Kaikki valitut olivat jo listalla 👍");
          })
        }
      >
        🛒 Lisää valitut ({count}) ostoslistalle
      </button>
      {result && <p className="mt-2 text-center text-sm font-bold text-leaf">{result}</p>}
      <p className="mt-1 text-center text-xs text-muted">Poista rasti aineksista, joita on jo kotona.</p>
    </section>
  );
}

export function RecipeActions({ recipeId, isParent, defaultDate }: { recipeId: number; isParent: boolean; defaultDate: string }) {
  const [wishState, wishAction] = useActionState(createWish, undefined);
  const [mealState, mealAction] = useActionState(saveMeal, undefined);
  const [planning, setPlanning] = useState(false);

  if (isParent) {
    if (mealState?.ok) return <p className="card bg-leaf-soft p-3 text-center font-bold">Lisätty ruokalistalle ✅</p>;
    return planning ? (
      <form action={mealAction} className="card flex flex-wrap gap-2 p-3">
        <input type="hidden" name="recipe_id" value={recipeId} />
        <input type="date" name="date" defaultValue={defaultDate} className="input w-auto flex-1" required />
        <Submit className="btn">Lisää</Submit>
        <div className="w-full"><SlotPicker /></div>
        <div className="w-full"><FormError state={mealState} /></div>
      </form>
    ) : (
      <button className="btn w-full" onClick={() => setPlanning(true)}>📅 Lisää ruokalistalle</button>
    );
  }

  if (wishState?.ok) return <p className="card bg-grape-soft p-3 text-center font-bold">Toive lähetetty vanhemmille! 🚀</p>;
  return (
    <form action={wishAction}>
      <input type="hidden" name="recipe_id" value={recipeId} />
      <FormError state={wishState} />
      <Submit className="btn w-full">🙋 Toivo tätä ruoaksi</Submit>
    </form>
  );
}
