import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PageTitle } from "@/components/PageTitle";
import { addDays, dayLabel, isDate, shortDate, startOfWeek, today, weekNumber } from "@/lib/dates";
import { getMeals, getMembers, getRecipes, getWishes } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { approveMeals, deleteWish, rejectWish } from "@/app/actions";
import { CookBadge } from "@/components/CookPicker";
import { AddMeal, ApproveWish, MealItem, VoteButton, WishForm } from "./client";

export default async function Ruoka({ searchParams }: { searchParams: Promise<{ viikko?: string; tab?: string }> }) {
  const me = await requireMember();
  const sp = await searchParams;
  const tab = sp.tab === "toiveet" ? "toiveet" : "lista";
  const t = today();
  const weekStart = startOfWeek(isDate(sp.viikko) ? sp.viikko : t);
  const weekEnd = addDays(weekStart, 6);

  const [meals, wishes, recipes, members] = await Promise.all([
    getMeals(me.family_id, weekStart, weekEnd, { withProposals: true }),
    getWishes(me.family_id),
    getRecipes(me.family_id),
    getMembers(me.family_id),
  ]);
  const byId = new Map(members.map((m) => [m.id, m]));
  const pending = wishes.filter((w) => w.status === "pending");
  const decided = wishes.filter((w) => w.status !== "pending");
  const recipeOpts = recipes.map((r) => ({ id: r.id, title: r.title, emoji: r.emoji }));
  const isParent = me.role === "parent";
  const memberOpts = members.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }));
  const proposals = meals.filter((m) => m.status === "proposed");
  const proposers = [...new Set(proposals.map((m) => m.created_by))].map((id) => (id ? byId.get(id)?.name : null)).filter(Boolean);

  return (
    <div className="space-y-4">
      <PageTitle emoji="🍽️" title="Ruoka" />
      <div className="grid grid-cols-2 rounded-full bg-white p-1 shadow-sm">
        <Link href={`/ruoka?viikko=${weekStart}`} className={`rounded-full py-2 text-center font-black ${tab === "lista" ? "bg-brand text-white" : "text-muted"}`}>
          Ruokalista
        </Link>
        <Link href="/ruoka?tab=toiveet" className={`rounded-full py-2 text-center font-black ${tab === "toiveet" ? "bg-brand text-white" : "text-muted"}`}>
          Toiveet {pending.length > 0 && <span className="ml-1 rounded-full bg-berry px-2 text-xs text-white">{pending.length}</span>}
        </Link>
      </div>

      {tab === "lista" ? (
        <>
          <div className="flex items-center justify-between">
            <Link href={`/ruoka?viikko=${addDays(weekStart, -7)}`} className="btn btn-ghost btn-sm">‹</Link>
            <div className="text-center">
              <div className="font-black">Viikko {weekNumber(weekStart)}</div>
              <div className="text-xs text-muted">{shortDate(weekStart)}–{shortDate(weekEnd)}</div>
            </div>
            <Link href={`/ruoka?viikko=${addDays(weekStart, 7)}`} className="btn btn-ghost btn-sm">›</Link>
          </div>
          {isParent && proposals.length > 0 && (
            <div className="card flex items-center gap-3 border-grape/30 bg-grape-soft p-4">
              <span className="text-3xl">💡</span>
              <div className="flex-1">
                <div className="font-black">
                  {proposers.join(" ja ") || "Joku"} ehdotti {proposals.length} {proposals.length === 1 ? "ruokaa" : "ruokaa"} tälle viikolle
                </div>
                <div className="text-sm text-muted">Hyväksy tai hylkää ne alla yksitellen – tai kaikki kerralla.</div>
              </div>
              <form action={approveMeals}>
                <input type="hidden" name="from" value={weekStart} />
                <input type="hidden" name="to" value={weekEnd} />
                <button className="btn btn-green btn-sm">✓ Hyväksy kaikki</button>
              </form>
            </div>
          )}
          {!isParent && (
            <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold">
              💡 Voit suunnitella ruokalistaa! Lisää ruokia päiville – vanhemmat hyväksyvät ehdotuksesi.
            </p>
          )}
          <ul className="space-y-2">
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
              const dayMeals = meals.filter((m) => m.date === d);
              const past = d < t;
              // Jos iltaruoka on jo päätetty, seuraava lisäys on todennäköisimmin päiväruoka.
              const nextSlot = dayMeals.some((m) => m.slot === "ilta") && !dayMeals.some((m) => m.slot === "paiva") ? "paiva" : "ilta";
              return (
                <li key={d} className={`card p-3 ${d === t ? "ring-2 ring-brand" : ""} ${past ? "opacity-60" : ""}`}>
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-black text-muted">{dayLabel(d)}{d === t || d === addDays(t, 1) || d === addDays(t, -1) ? ` ${shortDate(d)}` : ""}</div>
                  </div>
                  {dayMeals.map((m) => (
                    <MealItem
                      key={m.id}
                      meal={m}
                      recipeEmoji={recipes.find((r) => r.id === m.recipe_id)?.emoji}
                      cook={m.cook_id ? byId.get(m.cook_id) : null}
                      proposer={m.status === "proposed" && m.created_by ? byId.get(m.created_by) : null}
                      isParent={isParent}
                      canEdit={isParent || (m.status === "proposed" && m.created_by === me.id)}
                      recipes={recipeOpts}
                      members={memberOpts}
                    />
                  ))}
                  {!past && <AddMeal date={d} recipes={recipeOpts} members={memberOpts} hasMeal={dayMeals.length > 0} defaultSlot={nextSlot} propose={!isParent} />}
                </li>
              );
            })}
          </ul>
          {!isParent && (
            <Link href="/ruoka?tab=toiveet" className="btn w-full">🙋 Toivo ruokaa</Link>
          )}
        </>
      ) : (
        <>
          <WishForm recipes={recipeOpts} members={memberOpts} />
          {pending.length === 0 ? (
            <p className="py-4 text-center text-muted">Ei avoimia toiveita. Mitä teidän perhe haluaisi syödä? 😋</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((w) => {
                const req = w.requested_by ? byId.get(w.requested_by) : null;
                return (
                  <li key={w.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <Avatar member={req} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-black leading-tight">
                          {w.recipe_id ? <Link href={`/reseptit/${w.recipe_id}`}>{w.title} 📖</Link> : w.title}
                        </div>
                        <div className="text-xs text-muted">{req?.name ?? "Joku"} toivoo</div>
                        {w.cook_id && (
                          <div className="mt-1">
                            {w.cook_id === w.requested_by ? (
                              <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-sm font-black text-leaf">👩‍🍳 Teen itse!</span>
                            ) : (
                              <CookBadge cook={byId.get(w.cook_id)} />
                            )}
                          </div>
                        )}
                        {w.note && <p className="mt-1 text-sm">“{w.note}”</p>}
                      </div>
                      <VoteButton wishId={w.id} voted={w.votes.includes(me.id)} count={w.votes.length} />
                    </div>
                    {w.votes.length > 0 && (
                      <div className="mt-2 flex -space-x-1.5">
                        {w.votes.map((v) => <Avatar key={v} member={byId.get(v)} size={22} />)}
                      </div>
                    )}
                    {isParent ? (
                      <div className="mt-3 space-y-2 border-t border-line pt-3">
                        <ApproveWish wishId={w.id} defaultDate={addDays(t, 1)} members={memberOpts} cookId={w.cook_id} />
                        <form action={rejectWish} className="flex gap-2">
                          <input type="hidden" name="id" value={w.id} />
                          <input name="note" className="input flex-1 py-2 text-sm" placeholder="Syy (valinnainen)" />
                          <button className="btn btn-ghost btn-sm">Ei nyt</button>
                        </form>
                      </div>
                    ) : (
                      w.requested_by === me.id && (
                        <form action={deleteWish} className="mt-2 text-right">
                          <input type="hidden" name="id" value={w.id} />
                          <button className="text-xs font-bold text-muted underline">Peru toive</button>
                        </form>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {decided.length > 0 && (
            <section>
              <h2 className="label mt-6">Viimeksi päätetyt</h2>
              <ul className="card divide-y divide-line">
                {decided.map((w) => (
                  <li key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xl">{w.status === "approved" ? "✅" : "💤"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{w.title}</div>
                      <div className="text-xs text-muted">
                        {w.status === "approved" && w.planned_date ? `Tulossa: ${dayLabel(w.planned_date).toLowerCase()}` : w.decision_note || "Ei tällä kertaa"}
                      </div>
                    </div>
                    <Avatar member={w.requested_by ? byId.get(w.requested_by) : null} size={24} />
                    {isParent && (
                      <form action={deleteWish}>
                        <input type="hidden" name="id" value={w.id} />
                        <button className="px-1 text-muted" aria-label="Poista">×</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
