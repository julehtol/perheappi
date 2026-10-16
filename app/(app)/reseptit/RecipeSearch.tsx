"use client";

import Link from "next/link";
import { useState } from "react";

type R = { id: number; title: string; emoji: string; minutes: number | null; ingredients: string };

export function RecipeSearch({ recipes }: { recipes: R[] }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const shown = s ? recipes.filter((r) => r.title.toLowerCase().includes(s) || r.ingredients.toLowerCase().includes(s)) : recipes;
  return (
    <>
      <input className="input" placeholder="🔍 Etsi nimellä tai aineksella…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="grid grid-cols-2 gap-3">
        {shown.map((r) => (
          <li key={r.id}>
            <Link href={`/reseptit/${r.id}`} className="card flex h-full flex-col items-center p-4 text-center">
              <span className="text-5xl">{r.emoji}</span>
              <span className="mt-2 font-black leading-tight">{r.title}</span>
              {r.minutes ? <span className="mt-1 text-xs text-muted">⏱️ {r.minutes} min</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="text-center text-muted">Ei osumia haulle “{q}”.</p>}
    </>
  );
}
