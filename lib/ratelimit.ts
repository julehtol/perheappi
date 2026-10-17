import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

const WINDOW = "15 minutes";
const MAX_FAILURES = 8;

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/**
 * Arvausrajoitus: jos jollakin avaimista (esim. IP-osoite tai profiili) on liikaa
 * epäonnistuneita yrityksiä viimeisen vartin aikana, palautetaan virheteksti.
 */
export async function blocked(keys: string[]): Promise<string | null> {
  const sql = await db();
  const [{ n }] = await sql<{ n: number }[]>`
    SELECT COALESCE(max(c), 0)::int AS n FROM (
      SELECT count(*) AS c FROM failed_attempts
      WHERE key = ANY(${keys}) AND at > now() - ${WINDOW}::interval
      GROUP BY key
    ) t`;
  return n >= MAX_FAILURES ? "Liian monta väärää yritystä. Odota vartti ja yritä uudelleen." : null;
}

export async function recordFailure(keys: string[]) {
  const sql = await db();
  for (const key of keys) await sql`INSERT INTO failed_attempts (key) VALUES (${key})`;
  // Siivotaan vanhat merkinnät satunnaisesti.
  if (Math.random() < 0.05) await sql`DELETE FROM failed_attempts WHERE at < now() - interval '1 day'`;
}

/** Perheen luontisalasana tulee Vercelin ympäristömuuttujasta PERHE_SALASANA. */
export function familyPasswordConfigured() {
  return Boolean(process.env.PERHE_SALASANA);
}

export function checkFamilyPassword(input: string) {
  const real = process.env.PERHE_SALASANA;
  if (!real) return false;
  const a = createHash("sha256").update(input.trim()).digest();
  const b = createHash("sha256").update(real.trim()).digest();
  return timingSafeEqual(a, b);
}
