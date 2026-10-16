"use client";

import { Avatar } from "@/components/Avatar";
import type { Member } from "@/lib/types";

export type MemberLite = Pick<Member, "id" | "name" | "emoji" | "color">;

/** Valitse ruoan tekijä. Arvo lähetetään lomakkeessa nimellä cook_id. */
export function CookPicker({ members, defaultValue, label = "👩‍🍳 Kuka tekee?" }: { members: MemberLite[]; defaultValue?: number | null; label?: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        <label className="cursor-pointer">
          <input type="radio" name="cook_id" value="" defaultChecked={!defaultValue} className="peer sr-only" />
          <span className="block rounded-full border-2 border-line bg-white px-3 py-1 text-sm font-bold text-muted peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-ink">
            Ei vielä tiedossa
          </span>
        </label>
        {members.map((m) => (
          <label key={m.id} className="cursor-pointer">
            <input type="radio" name="cook_id" value={m.id} defaultChecked={defaultValue === m.id} className="peer sr-only" />
            <span className="flex items-center gap-1.5 rounded-full border-2 border-line bg-white py-0.5 pl-0.5 pr-3 text-sm font-bold peer-checked:border-brand peer-checked:bg-brand-soft">
              <Avatar member={m} size={24} />
              {m.name}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CookBadge({ cook }: { cook?: MemberLite | null }) {
  if (!cook) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-muted">
      👩‍🍳 <Avatar member={cook} size={20} /> {cook.name}
    </span>
  );
}
