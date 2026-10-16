import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PageTitle } from "@/components/PageTitle";
import { addDays, addMonths, dayLabel, isDate, monthLabel, monthOf, startOfWeek, today, WEEKDAYS_SHORT } from "@/lib/dates";
import { getEvents, getMeals, getMembers } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import type { CalendarEvent } from "@/lib/types";
import { SLOT_SHORT } from "@/lib/meals";

function covers(e: CalendarEvent, d: string) {
  return e.date <= d && (e.end_date ?? e.date) >= d;
}

export default async function Kalenteri({ searchParams }: { searchParams: Promise<{ kk?: string; pv?: string }> }) {
  const me = await requireMember();
  const sp = await searchParams;
  const t = today();
  const selected = isDate(sp.pv) ? sp.pv : t;
  const month = sp.kk && /^\d{4}-\d{2}$/.test(sp.kk) ? sp.kk : monthOf(selected);
  const gridStart = startOfWeek(`${month}-01`);
  const gridEnd = addDays(gridStart, 41);

  const [events, members, meals] = await Promise.all([
    getEvents(me.family_id, gridStart, gridEnd),
    getMembers(me.family_id),
    getMeals(me.family_id, selected, selected),
  ]);
  const byId = new Map(members.map((m) => [m.id, m]));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // Ei näytetä kuudetta viikkoa, jos se on kokonaan seuraavaa kuukautta.
  const visible = monthOf(days[35]) !== month ? days.slice(0, 35) : days;
  const dayEvents = events.filter((e) => covers(e, selected));

  return (
    <div className="space-y-4">
      <PageTitle emoji="📅" title="Kalenteri">
        <Link href={`/kalenteri/uusi?pv=${selected}`} className="btn btn-sm">+ Uusi</Link>
      </PageTitle>

      <section className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <Link href={`/kalenteri?kk=${addMonths(month, -1)}&pv=${selected}`} className="btn btn-ghost btn-sm">‹</Link>
          <div className="font-black">{monthLabel(month)}</div>
          <Link href={`/kalenteri?kk=${addMonths(month, 1)}&pv=${selected}`} className="btn btn-ghost btn-sm">›</Link>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-bold text-muted">
          {WEEKDAYS_SHORT.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {visible.map((d) => {
            const evs = events.filter((e) => covers(e, d));
            const inMonth = monthOf(d) === month;
            const isSel = d === selected;
            return (
              <Link
                key={d}
                href={`/kalenteri?kk=${month}&pv=${d}`}
                className={`flex aspect-square flex-col items-center justify-start rounded-xl pt-1 text-sm font-bold transition
                  ${isSel ? "bg-brand text-white" : d === t ? "bg-brand-soft" : ""} ${inMonth ? "" : "opacity-35"}`}
              >
                {Number(d.slice(8))}
                <span className="mt-0.5 flex gap-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white" : "bg-brand"}`} />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
        {(month !== monthOf(t) || selected !== t) && (
          <div className="mt-2 text-center">
            <Link href="/kalenteri" className="text-sm font-bold text-brand-dark">Tänään</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-black">{dayLabel(selected)}</h2>
        {meals.length > 0 && (
          <div className="mb-2 rounded-2xl bg-brand-soft px-4 py-2 text-sm font-bold">🍽️ {meals.map((m) => `${SLOT_SHORT[m.slot]}: ${m.title}${m.cook_id && byId.get(m.cook_id) ? ` (👩‍🍳 ${byId.get(m.cook_id)!.name})` : ""}`).join(" · ")}</div>
        )}
        {dayEvents.length === 0 ? (
          <div className="card p-6 text-center text-muted">
            Ei tapahtumia. <Link href={`/kalenteri/uusi?pv=${selected}`} className="font-bold text-brand-dark">Lisää?</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((e) => (
              <li key={e.id}>
                <Link href={`/kalenteri/${e.id}`} className="card flex items-center gap-3 p-4">
                  <span className="text-3xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-black">{e.title}</div>
                    <div className="text-sm text-muted">
                      {e.start_time ? `klo ${e.start_time}${e.end_time ? `–${e.end_time}` : ""}` : "Koko päivä"}
                      {e.end_date ? ` · ${dayLabel(e.date)} – ${dayLabel(e.end_date).toLowerCase()}` : ""}
                    </div>
                    {e.note && <div className="mt-1 line-clamp-2 text-sm">{e.note}</div>}
                  </div>
                  <div className="flex -space-x-2">
                    {e.participants.map((p) => <Avatar key={p} member={byId.get(p)} size={28} />)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
