import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, getOrCreateSetting } from "./db";
import type { Member } from "./types";

const SESSION_COOKIE = "perhe_session";
const FAMILY_COOKIE = "perhe_family";
const YEAR = 60 * 60 * 24 * 365;

async function secret() {
  return process.env.SESSION_SECRET || (await getOrCreateSetting("session_secret", () => randomBytes(32).toString("hex")));
}

async function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", await secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", await secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: YEAR,
};

export async function setSession(memberId: number, familyId: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sign({ m: memberId, f: familyId }), cookieOpts);
  jar.set(FAMILY_COOKIE, await sign({ f: familyId }), cookieOpts);
}

export async function setFamilyCookie(familyId: number) {
  const jar = await cookies();
  jar.set(FAMILY_COOKIE, await sign({ f: familyId }), cookieOpts);
}

/** Vaihda profiilia: perhe muistetaan, profiili unohdetaan. */
export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function leaveFamily() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(FAMILY_COOKIE);
}

export async function getFamilyId(): Promise<number | null> {
  const jar = await cookies();
  const s = await verify<{ m: number; f: number }>(jar.get(SESSION_COOKIE)?.value);
  if (s) return s.f;
  const f = await verify<{ f: number }>(jar.get(FAMILY_COOKIE)?.value);
  return f?.f ?? null;
}

export async function getMember(): Promise<Member | null> {
  const jar = await cookies();
  const s = await verify<{ m: number; f: number }>(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const sql = await db();
  const rows = await sql<Member[]>`
    SELECT id, family_id, name, emoji, color, role, notify_prefs, (pin_hash IS NOT NULL) AS has_pin
    FROM members WHERE id = ${s.m} AND family_id = ${s.f}`;
  return rows[0] ?? null;
}

/** Palauttaa kirjautuneen jäsenen tai ohjaa aloitussivulle. */
export async function requireMember(): Promise<Member> {
  const m = await getMember();
  if (!m) redirect("/aloitus");
  return m;
}

export async function requireParent(): Promise<Member> {
  const m = await requireMember();
  if (m.role !== "parent") throw new Error("Vain vanhemmat voivat tehdä tämän");
  return m;
}

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function checkPin(pin: string, stored: string | null) {
  if (!stored) return true;
  const [salt, hash] = stored.split(":");
  const test = scryptSync(pin, salt, 32);
  const real = Buffer.from(hash, "hex");
  return test.length === real.length && timingSafeEqual(test, real);
}
