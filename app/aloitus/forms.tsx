"use client";

import { useActionState, useState } from "react";
import { chooseProfile, createFamily, createOwnProfile, joinFamily } from "../actions";
import { EmojiPicker, PERSON_EMOJIS } from "@/components/EmojiPicker";
import { FormError, Submit } from "@/components/Submit";
import { Avatar } from "@/components/Avatar";

export function JoinForm() {
  const [state, action] = useActionState(joinFamily, undefined);
  return (
    <form action={action} className="space-y-3">
      <input name="code" className="input text-center font-mono text-xl tracking-[0.3em] uppercase" placeholder="KOODI" autoComplete="off" autoCapitalize="characters" />
      <FormError state={state} />
      <Submit className="btn w-full">Liity</Submit>
    </form>
  );
}

export function CreateFamilyForm() {
  const [state, action] = useActionState(createFamily, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Luontisalasana</label>
        <input name="password" type="password" className="input" autoComplete="off" required />
      </div>
      <div>
        <label className="label">Perheen nimi</label>
        <input name="family" className="input" placeholder="esim. Virtaset" required />
      </div>
      <div>
        <label className="label">Sinun nimesi</label>
        <input name="name" className="input" placeholder="esim. Äiti tai Juho" required />
      </div>
      <div>
        <label className="label">Valitse hahmo</label>
        <EmojiPicker name="emoji" options={PERSON_EMOJIS} />
      </div>
      <div>
        <label className="label">Vanhemman PIN-koodi</label>
        <input name="pin" className="input" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={8} placeholder="4–8 numeroa" required />
        <p className="mt-1 text-xs text-muted">PIN estää lapsia kirjautumasta vanhemman profiiliin ja hyväksymästä omia toiveitaan 😉</p>
      </div>
      <FormError state={state} />
      <Submit className="btn w-full">Luo perhe</Submit>
    </form>
  );
}

type PickMember = { id: number; name: string; emoji: string; color: string; role: string; has_pin: boolean };

export function ProfilePicker({ members }: { members: PickMember[] }) {
  const [selected, setSelected] = useState<PickMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, action] = useActionState(chooseProfile, undefined);
  const [newState, newAction] = useActionState(createOwnProfile, undefined);

  if (creating) {
    return (
      <form action={newAction} className="card mt-6 space-y-4 p-5">
        <h2 className="text-xl font-black">Uusi profiili</h2>
        <div>
          <label className="label">Nimi</label>
          <input name="name" className="input" autoFocus required />
        </div>
        <div>
          <label className="label">Hahmo</label>
          <EmojiPicker name="emoji" options={PERSON_EMOJIS} defaultValue="🦊" />
        </div>
        <p className="text-xs text-muted">Uusi profiili luodaan lapsen oikeuksilla. Vanhempi voi muuttaa sen asetuksista.</p>
        <FormError state={newState} />
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost flex-1" onClick={() => setCreating(false)}>Takaisin</button>
          <Submit className="btn flex-1">Valmis</Submit>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelected(m)}
            className={`card flex flex-col items-center gap-2 p-4 transition ${selected?.id === m.id ? "ring-4 ring-brand" : ""}`}
          >
            <Avatar member={m} size={64} />
            <span className="font-black">{m.name}</span>
            {m.role === "parent" && <span className="text-xs font-bold text-muted">vanhempi</span>}
          </button>
        ))}
        <button type="button" onClick={() => setCreating(true)} className="flex flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-line bg-white/75 p-4 text-muted backdrop-blur-sm">
          <span className="text-4xl">＋</span>
          <span className="font-bold">Olen uusi</span>
        </button>
      </div>
      {selected && (
        <form action={action} className="card mt-4 space-y-3 p-4">
          <input type="hidden" name="member" value={selected.id} />
          {selected.has_pin && (
            <div>
              <label className="label">PIN-koodi ({selected.name})</label>
              <input name="pin" type="password" className="input text-center text-2xl tracking-[0.5em]" inputMode="numeric" pattern="[0-9]*" autoFocus />
            </div>
          )}
          <FormError state={state} />
          <Submit className="btn w-full">Jatka {selected.emoji}</Submit>
        </form>
      )}
    </div>
  );
}
