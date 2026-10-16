import "server-only";
import webpush from "web-push";
import { after } from "next/server";
import { db, getOrCreateSetting } from "./db";
import type { NotifyKind } from "./types";

type Keys = { publicKey: string; privateKey: string };

let configured: Promise<Keys> | null = null;

/** VAPID-avaimet: ympäristömuuttujista tai luodaan kerran ja tallennetaan tietokantaan. */
export function vapidKeys(): Promise<Keys> {
  if (!configured) {
    configured = (async () => {
      let keys: Keys;
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        keys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
      } else {
        const raw = await getOrCreateSetting("vapid_keys", () => JSON.stringify(webpush.generateVAPIDKeys()));
        keys = JSON.parse(raw);
      }
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:perheappi@example.com", keys.publicKey, keys.privateKey);
      return keys;
    })().catch((e) => {
      configured = null;
      throw e;
    });
  }
  return configured;
}

export type PushMessage = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type Target = {
  familyId: number;
  kind: NotifyKind;
  /** Lähettäjä, jolle ilmoitusta ei lähetetä. */
  exclude?: number;
  onlyParents?: boolean;
  onlyMembers?: number[];
};

/** Lähettää push-ilmoituksen perheenjäsenille vastauksen jälkeen (ei hidasta käyttöliittymää). */
export function notify(target: Target, msg: PushMessage) {
  after(() => send(target, msg).catch((e) => console.error("push epäonnistui", e)));
}

async function send(target: Target, msg: PushMessage) {
  const sql = await db();
  await vapidKeys();
  const subs = await sql<{ id: number; endpoint: string; p256dh: string; auth: string }[]>`
    SELECT s.id, s.endpoint, s.p256dh, s.auth
    FROM push_subscriptions s JOIN members m ON m.id = s.member_id
    WHERE m.family_id = ${target.familyId}
      AND m.id <> ${target.exclude ?? -1}
      AND COALESCE((m.notify_prefs ->> ${target.kind})::boolean, true)
      ${target.onlyParents ? sql`AND m.role = 'parent'` : sql``}
      ${target.onlyMembers ? sql`AND m.id = ANY(${target.onlyMembers})` : sql``}
  `;
  const payload = JSON.stringify(msg);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: "normal",
        });
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        // Vanhentunut tilaus (esim. sovellus poistettu puhelimesta).
        if (code === 404 || code === 410) await sql`DELETE FROM push_subscriptions WHERE id = ${s.id}`;
        else console.error("push", code, err);
      }
    }),
  );
}
