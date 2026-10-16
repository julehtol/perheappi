"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Koti", emoji: "🏠" },
  { href: "/ostokset", label: "Ostokset", emoji: "🛒" },
  { href: "/ruoka", label: "Ruoka", emoji: "🍽️" },
  { href: "/reseptit", label: "Reseptit", emoji: "📖" },
  { href: "/kalenteri", label: "Kalenteri", emoji: "📅" },
];

export function BottomNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-xl">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          const badge = badges[it.href];
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active ? "text-brand-dark" : "text-muted"}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full text-xl transition ${active ? "bg-brand-soft" : ""}`}>
                  {it.emoji}
                </span>
                {it.label}
                {badge ? (
                  <span className="absolute right-[calc(50%-24px)] top-1 min-w-5 rounded-full bg-berry px-1.5 text-center text-[11px] leading-5 text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
