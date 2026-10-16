"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addMember, setMyPin, setNotifyPref, updateMyProfile } from "@/app/actions";
import { EmojiPicker, PERSON_EMOJIS } from "@/components/EmojiPicker";
import { FormError, Submit } from "@/components/Submit";
import type { NotifyKind, NotifyPrefs } from "@/lib/types";

const COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#0ea5e9", "#10b981", "#eab308", "#ef4444", "#14b8a6"];

export function ProfileForm({ name, emoji, color }: { name: string; emoji: string; color: string }) {
  const [state, action] = useActionState(updateMyProfile, undefined);
  const [c, setC] = useState(color);
  return (
    <form action={action} className="space-y-3">
      <input name="name" className="input" defaultValue={name} required />
      <EmojiPicker name="emoji" options={PERSON_EMOJIS.includes(emoji) ? PERSON_EMOJIS : [emoji, ...PERSON_EMOJIS]} defaultValue={emoji} />
      <input type="hidden" name="color" value={c} />
      <div className="flex gap-2">
        {COLORS.map((x) => (
          <button key={x} type="button" onClick={() => setC(x)} className={`h-8 w-8 rounded-full ${c === x ? "ring-4 ring-offset-2" : ""}`} style={{ background: x, ["--tw-ring-color" as string]: x }} aria-label={x} />
        ))}
      </div>
      <FormError state={state} />
      {state?.ok && <p className="text-sm font-bold text-leaf">Tallennettu ✅</p>}
      <Submit className="btn btn-sm">Tallenna profiili</Submit>
    </form>
  );
}

export function PinForm({ hasPin, isParent }: { hasPin: boolean; isParent: boolean }) {
  const [state, action] = useActionState(setMyPin, undefined);
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="text-sm font-bold text-brand-dark underline" onClick={() => setOpen(true)}>
        {hasPin ? "Vaihda PIN-koodi" : "Lisää PIN-koodi profiiliin"}
      </button>
    );
  return (
    <form action={action} className="space-y-2">
      <input name="pin" className="input" inputMode="numeric" pattern="[0-9]*" placeholder={isParent ? "Uusi PIN (4–8 numeroa)" : "Uusi PIN (tyhjä = ei PIN-koodia)"} />
      <FormError state={state} />
      {state?.ok && <p className="text-sm font-bold text-leaf">PIN päivitetty ✅</p>}
      <Submit className="btn btn-sm">Tallenna PIN</Submit>
    </form>
  );
}

const KINDS: { kind: NotifyKind; label: string }[] = [
  { kind: "shopping", label: "🛒 Ostoslistan lisäykset" },
  { kind: "wishes", label: "🙏 Ruokatoiveet ja päätökset" },
  { kind: "meals", label: "🍽️ Ruokalistan muutokset" },
  { kind: "events", label: "📅 Uudet kalenteritapahtumat" },
  { kind: "recipes", label: "📖 Uudet reseptit" },
];

export function NotifyToggles({ prefs }: { prefs: NotifyPrefs; isParent: boolean }) {
  const [, start] = useTransition();
  const [local, setLocal] = useState(prefs);
  return (
    <div className="space-y-1 border-t border-line pt-3">
      <div className="label">Mistä haluat ilmoituksen?</div>
      {KINDS.map(({ kind, label }) => {
        const on = local[kind] !== false;
        return (
          <label key={kind} className="flex items-center justify-between py-1.5">
            <span className="font-semibold">{label}</span>
            <input
              type="checkbox"
              className="h-6 w-6 accent-brand"
              checked={on}
              onChange={(e) => {
                const v = e.target.checked;
                setLocal((p) => ({ ...p, [kind]: v }));
                start(() => setNotifyPref(kind, v));
              }}
            />
          </label>
        );
      })}
    </div>
  );
}

export function ShareInvite({ url, code, familyName }: { url: string; code: string; familyName: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `Liity perheen ${familyName} Perheappiin! 🏡`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Perheappi", text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }
  return (
    <div className="rounded-2xl bg-cream p-3 text-center">
      <div className="label">Kutsukoodi</div>
      <div className="font-mono text-3xl font-black tracking-[0.25em]">{code}</div>
      <button className="btn btn-sm mt-2" onClick={share}>{copied ? "Linkki kopioitu ✅" : "📤 Jaa kutsulinkki"}</button>
      <p className="mt-2 text-xs text-muted">Lähetä linkki perheenjäsenelle. Hän valitsee oman profiilinsa tai luo uuden.</p>
    </div>
  );
}

export function AddMemberForm() {
  const [state, action] = useActionState(addMember, undefined);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("child");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      setOpen(false);
    }
  }, [state]);
  if (!open) return <button className="btn btn-ghost w-full" onClick={() => setOpen(true)}>+ Lisää perheenjäsen</button>;
  return (
    <form ref={form} action={action} className="space-y-3 rounded-2xl bg-cream p-3">
      <input name="name" className="input" placeholder="Nimi" required />
      <EmojiPicker name="emoji" options={PERSON_EMOJIS} defaultValue="🐻" />
      <select name="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="child">Lapsi</option>
        <option value="parent">Vanhempi</option>
      </select>
      <input name="pin" className="input" inputMode="numeric" pattern="[0-9]*" placeholder={role === "parent" ? "PIN-koodi (pakollinen)" : "PIN-koodi (valinnainen)"} />
      <FormError state={state} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Peru</button>
        <Submit className="btn btn-sm flex-1">Lisää</Submit>
      </div>
    </form>
  );
}
