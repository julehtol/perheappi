"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveEvent } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { EmojiPicker, EVENT_EMOJIS } from "@/components/EmojiPicker";
import { FormError, Submit } from "@/components/Submit";
import type { CalendarEvent, Member } from "@/lib/types";

type M = Pick<Member, "id" | "name" | "emoji" | "color">;

export function EventForm({ event, date, members }: { event?: CalendarEvent; date: string; members: M[] }) {
  const [state, action] = useActionState(saveEvent, undefined);
  const [who, setWho] = useState<number[]>(event?.participants ?? []);
  const [multi, setMulti] = useState(Boolean(event?.end_date));

  return (
    <form action={action} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div>
        <label className="label">Mitä?</label>
        <input name="title" className="input text-lg font-bold" defaultValue={event?.title} placeholder="esim. Mummon synttärit" required />
      </div>
      <div>
        <label className="label">Kuvake</label>
        <EmojiPicker name="emoji" options={EVENT_EMOJIS} defaultValue={event?.emoji} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={multi ? "" : "col-span-2"}>
          <label className="label">{multi ? "Alkaa" : "Päivä"}</label>
          <input type="date" name="date" className="input" defaultValue={event?.date ?? date} required />
        </div>
        {multi && (
          <div>
            <label className="label">Päättyy</label>
            <input type="date" name="end_date" className="input" defaultValue={event?.end_date ?? ""} />
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" className="h-5 w-5 accent-brand" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
        Usean päivän tapahtuma (esim. mökkireissu)
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Kello (alkaa)</label>
          <input type="time" name="start_time" className="input" defaultValue={event?.start_time ?? ""} />
        </div>
        <div>
          <label className="label">Kello (päättyy)</label>
          <input type="time" name="end_time" className="input" defaultValue={event?.end_time ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">Ketä koskee?</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const on = who.includes(m.id);
            return (
              <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 font-bold ${on ? "border-brand bg-brand-soft" : "border-line bg-white"}`}>
                <input
                  type="checkbox"
                  name="participants"
                  value={m.id}
                  checked={on}
                  onChange={(e) => setWho((w) => (e.target.checked ? [...w, m.id] : w.filter((x) => x !== m.id)))}
                  className="sr-only"
                />
                <Avatar member={m} size={26} />
                {m.name}
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <label className="label">Lisätiedot</label>
        <textarea name="note" rows={3} className="input" defaultValue={event?.note ?? ""} placeholder="Paikka, muistettavaa, kuka hakee…" />
      </div>
      <FormError state={state} />
      <div className="flex gap-2">
        <Link href={`/kalenteri?pv=${event?.date ?? date}`} className="btn btn-ghost flex-1">Peru</Link>
        <Submit className="btn flex-1">Tallenna</Submit>
      </div>
    </form>
  );
}
