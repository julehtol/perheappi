import "server-only";
import { db } from "./db";
import type { CalendarEvent, Meal, Member, Recipe, ShoppingItem, Wish } from "./types";

export async function getFamily(familyId: number) {
  const sql = await db();
  const [f] = await sql<{ id: number; name: string; invite_code: string }[]>`
    SELECT id, name, invite_code FROM families WHERE id = ${familyId}`;
  return f ?? null;
}

export async function getMembers(familyId: number) {
  const sql = await db();
  return sql<Member[]>`
    SELECT id, family_id, name, emoji, color, role, notify_prefs, (pin_hash IS NOT NULL) AS has_pin
    FROM members WHERE family_id = ${familyId}
    ORDER BY (role = 'parent') DESC, created_at`;
}

export async function getShoppingItems(familyId: number) {
  const sql = await db();
  return sql<ShoppingItem[]>`
    SELECT id, name, quantity, category, added_by, done, created_at::text
    FROM shopping_items WHERE family_id = ${familyId} AND NOT cleared
    ORDER BY done, created_at`;
}

/** Usein ostetut tuotteet, joita ei ole nyt listalla. */
export async function getShoppingSuggestions(familyId: number) {
  const sql = await db();
  const rows = await sql<{ name: string }[]>`
    SELECT min(name) AS name FROM shopping_items
    WHERE family_id = ${familyId}
    GROUP BY lower(name)
    HAVING bool_and(done)
    ORDER BY count(*) DESC, max(created_at) DESC
    LIMIT 40`;
  return rows.map((r) => r.name);
}

export async function getRecipes(familyId: number) {
  const sql = await db();
  return sql<Recipe[]>`
    SELECT id, title, emoji, servings, minutes, ingredients, instructions, source_url, created_by
    FROM recipes WHERE family_id = ${familyId} ORDER BY lower(title)`;
}

export async function getRecipe(familyId: number, id: number) {
  const sql = await db();
  const [r] = await sql<Recipe[]>`
    SELECT id, title, emoji, servings, minutes, ingredients, instructions, source_url, created_by
    FROM recipes WHERE family_id = ${familyId} AND id = ${id}`;
  return r ?? null;
}

export async function getMeals(familyId: number, from: string, to: string) {
  const sql = await db();
  return sql<Meal[]>`
    SELECT id, date, slot, title, cook_id, recipe_id, note, wish_id FROM meals
    WHERE family_id = ${familyId} AND date BETWEEN ${from} AND ${to}
    ORDER BY date, (slot = 'ilta'), id`;
}

export async function getWishes(familyId: number) {
  const sql = await db();
  return sql<Wish[]>`
    SELECT w.id, w.title, w.note, w.recipe_id, w.requested_by, w.cook_id, w.status, w.planned_date, w.decision_note,
      w.created_at::text,
      COALESCE(array_agg(v.member_id) FILTER (WHERE v.member_id IS NOT NULL), '{}') AS votes
    FROM wishes w LEFT JOIN wish_votes v ON v.wish_id = w.id
    WHERE w.family_id = ${familyId}
      AND (w.status = 'pending' OR w.decided_at > now() - interval '14 days')
    GROUP BY w.id
    ORDER BY (w.status = 'pending') DESC, count(v.member_id) DESC, w.created_at DESC`;
}

export async function getEvents(familyId: number, from: string, to: string) {
  const sql = await db();
  return sql<CalendarEvent[]>`
    SELECT id, title, date, end_date, start_time, end_time, note, emoji, participants, created_by
    FROM events
    WHERE family_id = ${familyId} AND date <= ${to} AND COALESCE(end_date, date) >= ${from}
    ORDER BY date, start_time NULLS FIRST, id`;
}

export async function getEvent(familyId: number, id: number) {
  const sql = await db();
  const [e] = await sql<CalendarEvent[]>`
    SELECT id, title, date, end_date, start_time, end_time, note, emoji, participants, created_by
    FROM events WHERE family_id = ${familyId} AND id = ${id}`;
  return e ?? null;
}
