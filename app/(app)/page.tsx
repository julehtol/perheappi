import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { InstallHint, PushPrompt } from "@/components/Push";
import { addDays, dayLabel, today } from "@/lib/dates";
import { getEvents, getMeals, getMembers, getShoppingItems, getWishes } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { QuickAdd } from "./ostokset/QuickAdd";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("fi-FI", { hour: "numeric", hour12: false, timeZone: "Europe/Helsinki" }).format(new Date()));
  if (h < 5) return "Hyvää yötä";
  if (h < 10) return "Huomenta";
  if (h < 17) return "Päivää";
  return "Iltaa";
}

export default async function Home() {
  const me = await requireMember();
  const t = today();
  const [meals, events, items, wishes, members] = await Promise.all([
    getMeals(me.family_id, t, addDays(t, 1)),
    getEvents(me.family_id, t, addDays(t, 7)),
    getShoppingItems(me.family_id),
    getWishes(me.family_id),
    getMembers(me.family_id),
  ]);
  const byId = new Map(members.map((m) => [m.id, m]));
  const open = items.filter((i) => !i.done);
  const pending = wishes.filter((w) => w.status === "pending");
  const todayMeals = meals.filter((m) => m.date === t);
  const tomorrowMeals = meals.filter((m) => m.date !== t);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">
        {greeting()}, {me.name}! <span className="inline-block">{me.emoji}</span>
      </h1>

      <PushPrompt />
      <InstallHint />

      <Link href="/ruoka" className="card block bg-gradient-to-br from-brand-soft to-white p-5">
        <div className="label">Tänään syödään</div>
        {todayMeals.length ? (
          todayMeals.map((m) => <div key={m.id} className="text-2xl font-black">🍽️ {m.title}</div>)
        ) : (
          <div className="text-xl font-bold text-muted">Ei vielä päätetty 🤔</div>
        )}
        {tomorrowMeals.length > 0 && (
          <div className="mt-2 text-sm text-muted">Huomenna: <b className="text-ink">{tomorrowMeals.map((m) => m.title).join(", ")}</b></div>
        )}
      </Link>

      {pending.length > 0 && (
        <Link href="/ruoka?tab=toiveet" className="card flex items-center gap-3 bg-grape-soft p-4">
          <span className="text-3xl">🙏</span>
          <div className="flex-1">
            <div className="font-black">
              {pending.length} ruokatoive{pending.length > 1 ? "tta" : ""} {me.role === "parent" ? "odottaa hyväksyntää" : "jonossa"}
            </div>
            <div className="text-sm text-muted">{pending.slice(0, 3).map((w) => w.title).join(", ")}</div>
          </div>
          <span className="text-xl">›</span>
        </Link>
      )}

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/ostokset" className="text-lg font-black">🛒 Ostoslista</Link>
          <Link href="/ostokset" className="text-sm font-bold text-brand-dark">{open.length} tuotetta ›</Link>
        </div>
        <QuickAdd compact />
        {open.length > 0 && (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{open.slice(-8).reverse().map((i) => i.name).join(" · ")}</p>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/kalenteri" className="text-lg font-black">📅 Tulossa</Link>
          <Link href="/kalenteri/uusi" className="text-sm font-bold text-brand-dark">+ Lisää</Link>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Ei tapahtumia seuraavan viikon aikana.</p>
        ) : (
          <ul className="divide-y divide-line">
            {events.slice(0, 6).map((e) => (
              <li key={e.id}>
                <Link href={`/kalenteri?pv=${e.date < t ? t : e.date}`} className="flex items-center gap-3 py-2">
                  <span className="text-2xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{e.title}</div>
                    <div className="text-xs text-muted">
                      {e.date < t ? "Käynnissä" : dayLabel(e.date)}
                      {e.start_time ? ` klo ${e.start_time}` : ""}
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {e.participants.map((p) => <Avatar key={p} member={byId.get(p)} size={24} />)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/ruoka?tab=toiveet" className="card p-4 text-center">
          <div className="text-3xl">🙋</div>
          <div className="font-black">Toivo ruokaa</div>
        </Link>
        <Link href="/reseptit/uusi" className="card p-4 text-center">
          <div className="text-3xl">📝</div>
          <div className="font-black">Uusi resepti</div>
        </Link>
      </section>
    </div>
  );
}
