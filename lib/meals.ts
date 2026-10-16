import type { Meal, MealSlot } from "./types";

export const SLOT_LABEL: Record<MealSlot, string> = { paiva: "päiväruoka", ilta: "iltaruoka" };
export const SLOT_SHORT: Record<MealSlot, string> = { paiva: "☀️ Päivä", ilta: "🌙 Ilta" };

/** Päivä/ilta-merkintä näytetään vain päivinä, joille on päiväruoka – arkena pelkkä ruoan nimi riittää. */
export function showSlots(meals: Pick<Meal, "slot">[]) {
  return meals.some((m) => m.slot === "paiva");
}
