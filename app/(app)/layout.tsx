import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember();
  const sql = await db();
  const [counts] = await sql<{ shopping: number; wishes: number }[]>`
    SELECT
      (SELECT count(*)::int FROM shopping_items WHERE family_id = ${me.family_id} AND NOT done) AS shopping,
      (SELECT count(*)::int FROM wishes WHERE family_id = ${me.family_id} AND status = 'pending') AS wishes`;

  return (
    <div className="mx-auto min-h-dvh max-w-xl">
      <header className="sticky top-0 z-20 bg-cream/90 pt-safe backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/" className="text-lg font-black tracking-tight">
            Perhe<span className="text-brand">appi</span>
          </Link>
          <Link href="/asetukset" className="flex items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1 text-sm font-bold shadow-sm" aria-label="Asetukset ja profiili">
            {me.name}
            <Avatar member={me} size={30} />
          </Link>
        </div>
      </header>
      <main className="px-4 pb-28 pt-2">{children}</main>
      <BottomNav badges={{ "/ostokset": counts.shopping, "/ruoka": me.role === "parent" ? counts.wishes : 0 }} />
      <AutoRefresh />
    </div>
  );
}
