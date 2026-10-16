"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guessCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { dayLabel, isDate } from "@/lib/dates";
import { notify, vapidKeys } from "@/lib/push";
import {
  checkPin,
  clearSession,
  getFamilyId,
  hashPin,
  leaveFamily,
  requireMember,
  requireParent,
  setFamilyCookie,
  setSession,
} from "@/lib/session";
import { SLOT_LABEL } from "@/lib/meals";
import type { MealSlot, NotifyKind } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean } | undefined;

const COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#0ea5e9", "#10b981", "#eab308", "#ef4444", "#14b8a6"];

function str(fd: FormData, key: string, max = 200) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function int(fd: FormData, key: string) {
  const n = parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : null;
}

function inviteCode() {
  // Helposti luettava koodi ilman sekoittuvia merkkejä.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function refresh() {
  revalidatePath("/", "layout");
}

function mealSlot(fd: FormData): MealSlot {
  return str(fd, "slot") === "paiva" ? "paiva" : "ilta";
}

function validPin(pin: string) {
  return /^\d{4,8}$/.test(pin);
}

/* ---------- Perhe ja profiilit ---------- */

export async function createFamily(_: FormState, fd: FormData): Promise<FormState> {
  const familyName = str(fd, "family", 60);
  const name = str(fd, "name", 40);
  const emoji = str(fd, "emoji", 16) || "🙂";
  const pin = str(fd, "pin", 8);
  if (!familyName || !name) return { error: "Anna perheen nimi ja oma nimesi." };
  if (!validPin(pin)) return { error: "PIN-koodin pitää olla 4–8 numeroa." };
  const sql = await db();
  const [family] = await sql<{ id: number }[]>`
    INSERT INTO families (name, invite_code) VALUES (${familyName}, ${inviteCode()}) RETURNING id`;
  const [member] = await sql<{ id: number }[]>`
    INSERT INTO members (family_id, name, emoji, color, role, pin_hash)
    VALUES (${family.id}, ${name}, ${emoji}, ${COLORS[0]}, 'parent', ${hashPin(pin)}) RETURNING id`;
  await setSession(member.id, family.id);
  redirect("/");
}

export async function joinFamily(_: FormState, fd: FormData): Promise<FormState> {
  const code = str(fd, "code", 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return { error: "Anna kutsukoodi." };
  const sql = await db();
  const [family] = await sql<{ id: number }[]>`SELECT id FROM families WHERE invite_code = ${code}`;
  if (!family) return { error: "Koodilla ei löytynyt perhettä. Tarkista koodi." };
  await setFamilyCookie(family.id);
  redirect("/aloitus");
}

export async function chooseProfile(_: FormState, fd: FormData): Promise<FormState> {
  const familyId = await getFamilyId();
  if (!familyId) return { error: "Liity ensin perheeseen." };
  const memberId = int(fd, "member");
  const pin = str(fd, "pin", 8);
  const sql = await db();
  const [m] = await sql<{ id: number; pin_hash: string | null }[]>`
    SELECT id, pin_hash FROM members WHERE id = ${memberId} AND family_id = ${familyId}`;
  if (!m) return { error: "Profiilia ei löytynyt." };
  if (m.pin_hash && !checkPin(pin, m.pin_hash)) return { error: "Väärä PIN-koodi." };
  await setSession(m.id, familyId);
  redirect("/");
}

export async function createOwnProfile(_: FormState, fd: FormData): Promise<FormState> {
  const familyId = await getFamilyId();
  if (!familyId) return { error: "Liity ensin perheeseen." };
  const name = str(fd, "name", 40);
  const emoji = str(fd, "emoji", 16) || "🙂";
  if (!name) return { error: "Anna nimi." };
  const sql = await db();
  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM members WHERE family_id = ${familyId}`;
  const [m] = await sql<{ id: number }[]>`
    INSERT INTO members (family_id, name, emoji, color, role)
    VALUES (${familyId}, ${name}, ${emoji}, ${COLORS[count % COLORS.length]}, 'child') RETURNING id`;
  await setSession(m.id, familyId);
  redirect("/");
}

export async function switchProfile() {
  await clearSession();
  redirect("/aloitus");
}

export async function leaveFamilyAction() {
  await leaveFamily();
  redirect("/aloitus");
}

export async function updateMyProfile(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const name = str(fd, "name", 40);
  const emoji = str(fd, "emoji", 16) || me.emoji;
  const color = str(fd, "color", 9);
  if (!name) return { error: "Nimi ei voi olla tyhjä." };
  const sql = await db();
  await sql`UPDATE members SET name = ${name}, emoji = ${emoji}, color = ${COLORS.includes(color) ? color : me.color}
    WHERE id = ${me.id}`;
  refresh();
  return { ok: true };
}

export async function setMyPin(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const pin = str(fd, "pin", 8);
  if (pin && !validPin(pin)) return { error: "PIN-koodin pitää olla 4–8 numeroa." };
  if (!pin && me.role === "parent") return { error: "Vanhemman profiilissa on oltava PIN-koodi." };
  const sql = await db();
  await sql`UPDATE members SET pin_hash = ${pin ? hashPin(pin) : null} WHERE id = ${me.id}`;
  refresh();
  return { ok: true };
}

export async function addMember(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireParent();
  const name = str(fd, "name", 40);
  const emoji = str(fd, "emoji", 16) || "🙂";
  const role = str(fd, "role") === "parent" ? "parent" : "child";
  const pin = str(fd, "pin", 8);
  if (!name) return { error: "Anna nimi." };
  if (role === "parent" && !validPin(pin)) return { error: "Vanhemmalle tarvitaan 4–8-numeroinen PIN-koodi." };
  if (pin && !validPin(pin)) return { error: "PIN-koodin pitää olla 4–8 numeroa." };
  const sql = await db();
  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM members WHERE family_id = ${me.family_id}`;
  await sql`INSERT INTO members (family_id, name, emoji, color, role, pin_hash)
    VALUES (${me.family_id}, ${name}, ${emoji}, ${COLORS[count % COLORS.length]}, ${role}, ${pin ? hashPin(pin) : null})`;
  refresh();
  return { ok: true };
}

export async function setMemberRole(fd: FormData) {
  const me = await requireParent();
  const id = int(fd, "id");
  const role = str(fd, "role") === "parent" ? "parent" : "child";
  if (id === me.id) return;
  const sql = await db();
  if (role === "parent") {
    // Vanhemmaksi korotettava tarvitsee PIN-koodin ennen kuin oikeudet aukeavat.
    const pin = str(fd, "pin", 8);
    if (!validPin(pin)) return;
    await sql`UPDATE members SET role = 'parent', pin_hash = ${hashPin(pin)} WHERE id = ${id} AND family_id = ${me.family_id}`;
  } else {
    await sql`UPDATE members SET role = 'child' WHERE id = ${id} AND family_id = ${me.family_id}`;
  }
  refresh();
}

export async function deleteMember(fd: FormData) {
  const me = await requireParent();
  const id = int(fd, "id");
  if (id === me.id) return;
  const sql = await db();
  await sql`DELETE FROM members WHERE id = ${id} AND family_id = ${me.family_id}`;
  refresh();
}

export async function newInviteCode() {
  const me = await requireParent();
  const sql = await db();
  await sql`UPDATE families SET invite_code = ${inviteCode()} WHERE id = ${me.family_id}`;
  refresh();
}

/* ---------- Push-ilmoitukset ---------- */

export async function getVapidPublicKey() {
  await requireMember();
  return (await vapidKeys()).publicKey;
}

export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const me = await requireMember();
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("Virheellinen tilaus");
  const sql = await db();
  await sql`
    INSERT INTO push_subscriptions (member_id, endpoint, p256dh, auth)
    VALUES (${me.id}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET member_id = EXCLUDED.member_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`;
}

export async function removePushSubscription(endpoint: string) {
  const me = await requireMember();
  const sql = await db();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND member_id = ${me.id}`;
}

export async function sendTestPush() {
  const me = await requireMember();
  notify(
    { familyId: me.family_id, kind: "shopping", onlyMembers: [me.id] },
    { title: "Perheappi 🎉", body: `Hei ${me.name}! Ilmoitukset toimivat.`, url: "/asetukset", tag: "test" },
  );
}

export async function setNotifyPref(kind: NotifyKind, on: boolean) {
  const me = await requireMember();
  const sql = await db();
  await sql`UPDATE members SET notify_prefs = notify_prefs || ${sql.json({ [kind]: on })} WHERE id = ${me.id}`;
  refresh();
}

/* ---------- Ostoslista ---------- */

export async function addShoppingItem(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const name = str(fd, "name", 80);
  const quantity = str(fd, "quantity", 30) || null;
  if (!name) return { error: "Kirjoita mitä pitää ostaa." };
  const sql = await db();
  const [dup] = await sql<{ id: number }[]>`
    SELECT id FROM shopping_items WHERE family_id = ${me.family_id} AND NOT done AND lower(name) = lower(${name})`;
  if (dup) return { error: `${name} on jo listalla.` };
  // Muistetaan kategoria, jos tuote on ostettu ennenkin ja sille on valittu kategoria käsin.
  const [prev] = await sql<{ category: string }[]>`
    SELECT category FROM shopping_items WHERE family_id = ${me.family_id} AND lower(name) = lower(${name})
    ORDER BY created_at DESC LIMIT 1`;
  const category = prev?.category ?? guessCategory(name);
  await sql`INSERT INTO shopping_items (family_id, name, quantity, category, added_by)
    VALUES (${me.family_id}, ${name}, ${quantity}, ${category}, ${me.id})`;
  notify(
    { familyId: me.family_id, kind: "shopping", exclude: me.id },
    { title: `🛒 ${me.name} lisäsi ostoslistalle`, body: quantity ? `${name} (${quantity})` : name, url: "/ostokset", tag: "shopping" },
  );
  refresh();
  return { ok: true };
}

export async function toggleShoppingItem(id: number, done: boolean) {
  const me = await requireMember();
  const sql = await db();
  await sql`UPDATE shopping_items SET done = ${done}, done_at = ${done ? sql`now()` : null}, done_by = ${done ? me.id : null}
    WHERE id = ${id} AND family_id = ${me.family_id}`;
  refresh();
}

export async function setShoppingCategory(id: number, category: string) {
  const me = await requireMember();
  const sql = await db();
  await sql`UPDATE shopping_items SET category = ${category} WHERE id = ${id} AND family_id = ${me.family_id}`;
  refresh();
}

export async function deleteShoppingItem(id: number) {
  const me = await requireMember();
  const sql = await db();
  await sql`DELETE FROM shopping_items WHERE id = ${id} AND family_id = ${me.family_id}`;
  refresh();
}

export async function clearDoneShopping() {
  const me = await requireMember();
  const sql = await db();
  // Ostetut piilotetaan listalta, mutta jäävät historiaan ehdotuksia varten.
  await sql`UPDATE shopping_items SET cleared = true WHERE family_id = ${me.family_id} AND done`;
  await sql`DELETE FROM shopping_items WHERE family_id = ${me.family_id} AND cleared AND done_at < now() - interval '120 days'`;
  refresh();
}

/** Lisää valitut ainekset ostoslistalle. Palauttaa lisättyjen määrän. */
export async function addIngredientsToShopping(names: string[], source: string) {
  const me = await requireMember();
  const sql = await db();
  let added = 0;
  for (const raw of names.slice(0, 60)) {
    const name = raw.trim().slice(0, 80);
    if (!name) continue;
    const [dup] = await sql`SELECT 1 FROM shopping_items WHERE family_id = ${me.family_id} AND NOT done AND lower(name) = lower(${name})`;
    if (dup) continue;
    await sql`INSERT INTO shopping_items (family_id, name, category, added_by)
      VALUES (${me.family_id}, ${name}, ${guessCategory(name)}, ${me.id})`;
    added++;
  }
  if (added) {
    notify(
      { familyId: me.family_id, kind: "shopping", exclude: me.id },
      { title: `🛒 ${me.name} lisäsi ${added} tuotetta`, body: `Ainekset: ${source}`, url: "/ostokset", tag: "shopping" },
    );
  }
  refresh();
  return added;
}

/* ---------- Reseptit ---------- */

export async function saveRecipe(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const id = int(fd, "id");
  const title = str(fd, "title", 100);
  const emoji = str(fd, "emoji", 16) || "🍲";
  const servings = int(fd, "servings");
  const minutes = int(fd, "minutes");
  const ingredients = str(fd, "ingredients", 5000);
  const instructions = str(fd, "instructions", 20000);
  let sourceUrl = str(fd, "source_url", 500) || null;
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) sourceUrl = `https://${sourceUrl}`;
  if (!title) return { error: "Anna reseptille nimi." };
  const sql = await db();
  let recipeId = id;
  if (id) {
    await sql`UPDATE recipes SET title = ${title}, emoji = ${emoji}, servings = ${servings}, minutes = ${minutes},
      ingredients = ${ingredients}, instructions = ${instructions}, source_url = ${sourceUrl}, updated_at = now()
      WHERE id = ${id} AND family_id = ${me.family_id}`;
  } else {
    const [r] = await sql<{ id: number }[]>`
      INSERT INTO recipes (family_id, title, emoji, servings, minutes, ingredients, instructions, source_url, created_by)
      VALUES (${me.family_id}, ${title}, ${emoji}, ${servings}, ${minutes}, ${ingredients}, ${instructions}, ${sourceUrl}, ${me.id})
      RETURNING id`;
    recipeId = r.id;
    notify(
      { familyId: me.family_id, kind: "recipes", exclude: me.id },
      { title: `${emoji} Uusi resepti`, body: `${me.name} lisäsi reseptin: ${title}`, url: `/reseptit/${r.id}`, tag: `recipe-${r.id}` },
    );
  }
  refresh();
  redirect(`/reseptit/${recipeId}`);
}

export async function deleteRecipe(fd: FormData) {
  const me = await requireMember();
  const id = int(fd, "id");
  const sql = await db();
  await sql`DELETE FROM recipes WHERE id = ${id} AND family_id = ${me.family_id}
    AND (created_by = ${me.id} OR ${me.role === "parent"})`;
  refresh();
  redirect("/reseptit");
}

/* ---------- Ruokalista ---------- */

export async function saveMeal(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireParent();
  const id = int(fd, "id");
  const date = str(fd, "date", 10);
  const recipeId = int(fd, "recipe_id");
  const note = str(fd, "note", 200) || null;
  const slot = mealSlot(fd);
  let title = str(fd, "title", 100);
  if (!isDate(date)) return { error: "Valitse päivä." };
  const sql = await db();
  if (recipeId && !title) {
    const [r] = await sql<{ title: string }[]>`SELECT title FROM recipes WHERE id = ${recipeId} AND family_id = ${me.family_id}`;
    title = r?.title ?? "";
  }
  if (!title) return { error: "Kirjoita ruoan nimi tai valitse resepti." };
  if (id) {
    await sql`UPDATE meals SET date = ${date}, slot = ${slot}, title = ${title}, recipe_id = ${recipeId}, note = ${note}
      WHERE id = ${id} AND family_id = ${me.family_id}`;
  } else {
    await sql`INSERT INTO meals (family_id, date, slot, title, recipe_id, note, created_by)
      VALUES (${me.family_id}, ${date}, ${slot}, ${title}, ${recipeId}, ${note}, ${me.id})`;
    notify(
      { familyId: me.family_id, kind: "meals", exclude: me.id },
      { title: "🍽️ Ruokalistaa päivitetty", body: `${dayLabel(date)} (${SLOT_LABEL[slot]}): ${title}`, url: `/ruoka?viikko=${date}`, tag: "meals" },
    );
  }
  refresh();
  return { ok: true };
}

export async function deleteMeal(fd: FormData) {
  const me = await requireParent();
  const sql = await db();
  await sql`DELETE FROM meals WHERE id = ${int(fd, "id")} AND family_id = ${me.family_id}`;
  refresh();
}

/* ---------- Ruokatoiveet ---------- */

export async function createWish(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const recipeId = int(fd, "recipe_id");
  const note = str(fd, "note", 200) || null;
  let title = str(fd, "title", 100);
  const sql = await db();
  if (recipeId && !title) {
    const [r] = await sql<{ title: string }[]>`SELECT title FROM recipes WHERE id = ${recipeId} AND family_id = ${me.family_id}`;
    title = r?.title ?? "";
  }
  if (!title) return { error: "Mitä ruokaa toivot?" };
  const [w] = await sql<{ id: number }[]>`
    INSERT INTO wishes (family_id, title, note, recipe_id, requested_by)
    VALUES (${me.family_id}, ${title}, ${note}, ${recipeId}, ${me.id}) RETURNING id`;
  await sql`INSERT INTO wish_votes (wish_id, member_id) VALUES (${w.id}, ${me.id})`;
  notify(
    { familyId: me.family_id, kind: "wishes", exclude: me.id },
    { title: `🙏 ${me.name} toivoo ruokaa`, body: note ? `${title} – ${note}` : title, url: "/ruoka?tab=toiveet", tag: `wish-${w.id}` },
  );
  refresh();
  return { ok: true };
}

export async function toggleWishVote(wishId: number) {
  const me = await requireMember();
  const sql = await db();
  const [w] = await sql`SELECT 1 FROM wishes WHERE id = ${wishId} AND family_id = ${me.family_id}`;
  if (!w) return;
  const del = await sql`DELETE FROM wish_votes WHERE wish_id = ${wishId} AND member_id = ${me.id}`;
  if (del.count === 0) await sql`INSERT INTO wish_votes (wish_id, member_id) VALUES (${wishId}, ${me.id})`;
  refresh();
}

export async function approveWish(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireParent();
  const id = int(fd, "id");
  const date = str(fd, "date", 10);
  const slot = mealSlot(fd);
  if (!isDate(date)) return { error: "Valitse päivä." };
  const sql = await db();
  const [w] = await sql<{ title: string; recipe_id: number | null; requested_by: number | null }[]>`
    UPDATE wishes SET status = 'approved', planned_date = ${date}, decided_by = ${me.id}, decided_at = now()
    WHERE id = ${id} AND family_id = ${me.family_id} RETURNING title, recipe_id, requested_by`;
  if (!w) return { error: "Toivetta ei löytynyt." };
  await sql`INSERT INTO meals (family_id, date, slot, title, recipe_id, wish_id, created_by)
    VALUES (${me.family_id}, ${date}, ${slot}, ${w.title}, ${w.recipe_id}, ${id}, ${me.id})`;
  notify(
    { familyId: me.family_id, kind: "wishes", exclude: me.id },
    { title: "🎉 Ruokatoive hyväksytty!", body: `${w.title} – ${dayLabel(date).toLowerCase()} (${SLOT_LABEL[slot]})`, url: `/ruoka?viikko=${date}`, tag: `wish-${id}` },
  );
  refresh();
  return { ok: true };
}

export async function rejectWish(fd: FormData) {
  const me = await requireParent();
  const id = int(fd, "id");
  const note = str(fd, "note", 200) || null;
  const sql = await db();
  const [w] = await sql<{ title: string; requested_by: number | null }[]>`
    UPDATE wishes SET status = 'rejected', decided_by = ${me.id}, decided_at = now(), decision_note = ${note}
    WHERE id = ${id} AND family_id = ${me.family_id} RETURNING title, requested_by`;
  if (w?.requested_by && w.requested_by !== me.id) {
    notify(
      { familyId: me.family_id, kind: "wishes", onlyMembers: [w.requested_by] },
      { title: "Ruokatoive ei mennyt läpi tällä kertaa", body: note ? `${w.title}: ${note}` : w.title, url: "/ruoka?tab=toiveet", tag: `wish-${id}` },
    );
  }
  refresh();
}

export async function deleteWish(fd: FormData) {
  const me = await requireMember();
  const sql = await db();
  await sql`DELETE FROM wishes WHERE id = ${int(fd, "id")} AND family_id = ${me.family_id}
    AND (${me.role === "parent"} OR (requested_by = ${me.id} AND status = 'pending'))`;
  refresh();
}

/* ---------- Kalenteri ---------- */

export async function saveEvent(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireMember();
  const id = int(fd, "id");
  const title = str(fd, "title", 100);
  const date = str(fd, "date", 10);
  let endDate: string | null = str(fd, "end_date", 10) || null;
  const startTime = str(fd, "start_time", 5) || null;
  const endTime = str(fd, "end_time", 5) || null;
  const note = str(fd, "note", 500) || null;
  const emoji = str(fd, "emoji", 16) || "📅";
  const participants = fd.getAll("participants").map((v) => parseInt(String(v), 10)).filter(Number.isFinite);
  if (!title) return { error: "Anna tapahtumalle nimi." };
  if (!isDate(date)) return { error: "Valitse päivä." };
  if (endDate && (!isDate(endDate) || endDate <= date)) endDate = null;
  const sql = await db();
  if (id) {
    await sql`UPDATE events SET title = ${title}, date = ${date}, end_date = ${endDate}, start_time = ${startTime},
      end_time = ${endTime}, note = ${note}, emoji = ${emoji}, participants = ${participants}
      WHERE id = ${id} AND family_id = ${me.family_id}`;
  } else {
    await sql`INSERT INTO events (family_id, title, date, end_date, start_time, end_time, note, emoji, participants, created_by)
      VALUES (${me.family_id}, ${title}, ${date}, ${endDate}, ${startTime}, ${endTime}, ${note}, ${emoji}, ${participants}, ${me.id})`;
    notify(
      { familyId: me.family_id, kind: "events", exclude: me.id },
      {
        title: `${emoji} Uusi tapahtuma kalenterissa`,
        body: `${title} – ${dayLabel(date).toLowerCase()}${startTime ? ` klo ${startTime}` : ""}`,
        url: `/kalenteri?pv=${date}`,
        tag: "events",
      },
    );
  }
  refresh();
  redirect(`/kalenteri?pv=${date}`);
}

export async function deleteEvent(fd: FormData) {
  const me = await requireMember();
  const sql = await db();
  const [e] = await sql<{ date: string }[]>`DELETE FROM events WHERE id = ${int(fd, "id")} AND family_id = ${me.family_id}
    AND (created_by = ${me.id} OR created_by IS NULL OR ${me.role === "parent"}) RETURNING date`;
  refresh();
  redirect(e ? `/kalenteri?pv=${e.date}` : "/kalenteri");
}
