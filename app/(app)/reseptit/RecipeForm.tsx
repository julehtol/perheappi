"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveRecipe } from "@/app/actions";
import { EmojiPicker, FOOD_EMOJIS } from "@/components/EmojiPicker";
import { FormError, Submit } from "@/components/Submit";
import type { Recipe } from "@/lib/types";

export function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const [state, action] = useActionState(saveRecipe, undefined);
  return (
    <form action={action} className="space-y-4">
      {recipe && <input type="hidden" name="id" value={recipe.id} />}
      <div>
        <label className="label">Nimi</label>
        <input name="title" className="input text-lg font-bold" defaultValue={recipe?.title} placeholder="esim. Mummon lihakeitto" required />
      </div>
      <div>
        <label className="label">Kuvake</label>
        <EmojiPicker name="emoji" options={FOOD_EMOJIS} defaultValue={recipe?.emoji} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Annoksia</label>
          <input name="servings" type="number" min={1} max={50} className="input" defaultValue={recipe?.servings ?? ""} placeholder="4" />
        </div>
        <div>
          <label className="label">Aika (min)</label>
          <input name="minutes" type="number" min={1} max={1440} className="input" defaultValue={recipe?.minutes ?? ""} placeholder="30" />
        </div>
      </div>
      <div>
        <label className="label">Ainekset</label>
        <textarea
          name="ingredients"
          rows={8}
          className="input"
          defaultValue={recipe?.ingredients}
          placeholder={"Yksi aines per rivi, esim.\n400 g jauheliha\n1 sipuli\n2 dl kermaa"}
        />
      </div>
      <div>
        <label className="label">Ohje</label>
        <textarea name="instructions" rows={10} className="input" defaultValue={recipe?.instructions} placeholder={"1. Kuullota sipuli…\n2. Lisää…"} />
      </div>
      <div>
        <label className="label">Linkki alkuperäiseen (valinnainen)</label>
        <input name="source_url" type="url" inputMode="url" className="input" defaultValue={recipe?.source_url ?? ""} placeholder="https://…" />
      </div>
      <FormError state={state} />
      <div className="flex gap-2">
        <Link href={recipe ? `/reseptit/${recipe.id}` : "/reseptit"} className="btn btn-ghost flex-1">Peru</Link>
        <Submit className="btn flex-1">Tallenna</Submit>
      </div>
    </form>
  );
}
