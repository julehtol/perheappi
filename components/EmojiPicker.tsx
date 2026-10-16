"use client";

import { useState } from "react";

export const PERSON_EMOJIS = ["🙂", "😎", "🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵", "🦄", "🐶", "🐱", "🐰", "🐨", "🐙", "🦖", "🚀", "⚽", "🎸", "🌸", "⭐", "👑", "🧁", "🍓"];
export const FOOD_EMOJIS = ["🍲", "🍝", "🍕", "🌮", "🍔", "🍛", "🍜", "🥘", "🍣", "🥗", "🍗", "🐟", "🥞", "🧆", "🥙", "🍖", "🥧", "🍰", "🍪", "🧁", "🥣", "🫕", "🌯", "🥪"];
export const EVENT_EMOJIS = ["📅", "🎂", "⚽", "🏒", "🎵", "🩰", "🏊", "🎉", "✈️", "🚗", "🏕️", "🩺", "🦷", "🏫", "🎄", "🎃", "🍽️", "🛍️", "🎬", "👵", "🏡", "💼", "🧹", "🎮"];

export function EmojiPicker({ name, options, defaultValue }: { name: string; options: string[]; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? options[0]);
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-1.5">
        {options.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setValue(e)}
            className={`grid h-10 w-10 place-items-center rounded-xl text-2xl transition ${value === e ? "scale-110 bg-brand-soft ring-2 ring-brand" : "bg-white"}`}
            aria-label={e}
            aria-pressed={value === e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
