"use client";

import type { MealSlot } from "@/lib/types";

export function SlotPicker({ defaultSlot = "ilta" }: { defaultSlot?: MealSlot }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ateria">
      {(["paiva", "ilta"] as const).map((s) => (
        <label key={s} className="cursor-pointer">
          <input type="radio" name="slot" value={s} defaultChecked={s === defaultSlot} className="peer sr-only" />
          <span className="block rounded-full border-2 border-line bg-white py-2 text-center text-sm font-black text-muted peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-ink">
            {s === "paiva" ? "☀️ Päiväruoka" : "🌙 Iltaruoka"}
          </span>
        </label>
      ))}
    </div>
  );
}
