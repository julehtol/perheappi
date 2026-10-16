"use client";

import { useEffect, useState } from "react";
import { getVapidPublicKey, removePushSubscription, savePushSubscription, sendTestPush } from "@/app/actions";

type Status = "loading" | "unsupported" | "needs-install" | "denied" | "off" | "on";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function safeStorage(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {}
  return null;
}

function usePush() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        setStatus(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Varmistetaan, että palvelin tuntee tilauksen tälle profiilille.
        savePushSubscription(sub.toJSON() as never).catch(() => {});
        setStatus("on");
      } else setStatus("off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = await getVapidPublicKey();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
      await savePushSubscription(sub.toJSON() as never);
      setStatus("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ilmoitusten käyttöönotto epäonnistui");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  return { status, busy, error, enable, disable };
}

/** Etusivun kehote ilmoitusten käyttöönottoon. */
export function PushPrompt() {
  const { status, busy, error, enable } = usePush();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => setDismissed(safeStorage("push-prompt-dismissed") === "1"), []);
  if (dismissed || status !== "off") return null;
  return (
    <div className="card flex items-center gap-3 border-sky/30 bg-sky-soft p-4">
      <span className="text-3xl">🔔</span>
      <div className="flex-1">
        <div className="font-black">Laita ilmoitukset päälle</div>
        <div className="text-sm text-muted">Saat tiedon, kun joku lisää ostoksen, toiveen tai tapahtuman.</div>
        {error && <div className="mt-1 text-sm text-berry">{error}</div>}
        <div className="mt-2 flex gap-2">
          <button className="btn btn-sm" onClick={enable} disabled={busy}>Ota käyttöön</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              safeStorage("push-prompt-dismissed", "1");
              setDismissed(true);
            }}
          >
            Myöhemmin
          </button>
        </div>
      </div>
    </div>
  );
}

/** Asetussivun ilmoituskytkin. */
export function PushSettings() {
  const { status, busy, error, enable, disable } = usePush();
  const [sent, setSent] = useState(false);

  if (status === "loading") return <p className="text-sm text-muted">Tarkistetaan…</p>;
  if (status === "needs-install")
    return (
      <p className="text-sm">
        iPhonessa ilmoitukset toimivat, kun Perheappi on lisätty Koti-valikkoon: paina Safarissa <b>Jaa</b>-painiketta ja valitse{" "}
        <b>Lisää Koti-valikkoon</b>. Avaa sovellus sitten kotivalikosta ja palaa tähän.
      </p>
    );
  if (status === "unsupported") return <p className="text-sm text-muted">Tämä selain ei tue push-ilmoituksia.</p>;
  if (status === "denied")
    return <p className="text-sm">Ilmoitukset on estetty. Salli ne puhelimen asetuksista (Asetukset → Ilmoitukset → Perheappi) ja lataa sivu uudelleen.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold">Ilmoitukset tähän laitteeseen</div>
          <div className="text-sm text-muted">{status === "on" ? "Päällä ✅" : "Pois päältä"}</div>
        </div>
        {status === "on" ? (
          <button className="btn btn-ghost btn-sm" onClick={disable} disabled={busy}>Poista</button>
        ) : (
          <button className="btn btn-sm" onClick={enable} disabled={busy}>Ota käyttöön</button>
        )}
      </div>
      {status === "on" && (
        <button
          className="text-sm font-bold text-brand-dark underline"
          onClick={async () => {
            await sendTestPush();
            setSent(true);
          }}
        >
          {sent ? "Testi lähetetty – tuliko? 📬" : "Lähetä testi-ilmoitus"}
        </button>
      )}
      {error && <p className="text-sm text-berry">{error}</p>}
    </div>
  );
}

/** Ohje sovelluksen lisäämiseen kotivalikkoon. */
export function InstallHint() {
  const [mode, setMode] = useState<"none" | "ios" | "android">("none");
  const [prompt, setPrompt] = useState<(Event & { prompt: () => Promise<void> }) | null>(null);

  useEffect(() => {
    if (isStandalone() || safeStorage("install-hint-dismissed") === "1") return;
    if (isIos()) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Event & { prompt: () => Promise<void> });
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "none") return null;
  const close = () => {
    safeStorage("install-hint-dismissed", "1");
    setMode("none");
  };
  return (
    <div className="card flex items-start gap-3 border-leaf/30 bg-leaf-soft p-4">
      <span className="text-3xl">📲</span>
      <div className="flex-1">
        <div className="font-black">Lisää Perheappi kotivalikkoon</div>
        {mode === "ios" ? (
          <p className="text-sm">
            Paina Safarin alapalkista <b>Jaa</b> <span aria-hidden>⬆️</span> ja valitse <b>Lisää Koti-valikkoon</b>. Silloin myös ilmoitukset toimivat.
          </p>
        ) : (
          <button className="btn btn-green btn-sm mt-2" onClick={() => prompt?.prompt().then(close)}>Asenna</button>
        )}
      </div>
      <button className="text-xl text-muted" onClick={close} aria-label="Sulje">×</button>
    </div>
  );
}
