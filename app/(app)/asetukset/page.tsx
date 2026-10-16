import { headers } from "next/headers";
import { deleteMember, newInviteCode, setMemberRole, switchProfile } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { PageTitle } from "@/components/PageTitle";
import { PushSettings } from "@/components/Push";
import { getFamily, getMembers } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { AddMemberForm, NotifyToggles, PinForm, ProfileForm, ShareInvite } from "./client";

export default async function Asetukset() {
  const me = await requireMember();
  const [family, members] = await Promise.all([getFamily(me.family_id), getMembers(me.family_id)]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const isParent = me.role === "parent";

  return (
    <div className="space-y-5">
      <PageTitle emoji="⚙️" title="Asetukset" />

      <section className="card space-y-3 p-4">
        <h2 className="text-lg font-black">🔔 Ilmoitukset</h2>
        <PushSettings />
        <NotifyToggles prefs={me.notify_prefs} isParent={isParent} />
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-lg font-black">🙂 Oma profiili</h2>
        <ProfileForm name={me.name} emoji={me.emoji} color={me.color} />
        <PinForm hasPin={me.has_pin} isParent={isParent} />
        <form action={switchProfile}>
          <button className="btn btn-ghost w-full">🔄 Vaihda profiilia</button>
        </form>
      </section>

      {family && (
        <section className="card space-y-3 p-4">
          <h2 className="text-lg font-black">🏡 Perhe {family.name}</h2>
          <ShareInvite url={`${origin}/liity/${family.invite_code}`} code={family.invite_code} familyName={family.name} />
          {isParent && (
            <form action={newInviteCode}>
              <button className="text-xs font-bold text-muted underline">Luo uusi kutsukoodi (vanha lakkaa toimimasta)</button>
            </form>
          )}

          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <Avatar member={m} size={36} />
                <div className="flex-1">
                  <div className="font-bold">{m.name}{m.id === me.id && " (sinä)"}</div>
                  <div className="text-xs text-muted">{m.role === "parent" ? "Vanhempi" : "Lapsi"}{m.has_pin ? " · PIN" : ""}</div>
                </div>
                {isParent && m.id !== me.id && (
                  <details className="relative">
                    <summary className="cursor-pointer list-none px-2 text-xl text-muted">⋯</summary>
                    <div className="absolute right-0 z-10 mt-1 w-64 space-y-2 rounded-2xl border border-line bg-white p-3 shadow-lg">
                      {m.role === "child" ? (
                        <form action={setMemberRole} className="space-y-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="role" value="parent" />
                          <input name="pin" className="input py-2 text-sm" inputMode="numeric" pattern="[0-9]{4,8}" placeholder="Uusi PIN (4–8 numeroa)" required />
                          <button className="btn btn-sm w-full">Tee vanhemmaksi</button>
                        </form>
                      ) : (
                        <form action={setMemberRole}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="role" value="child" />
                          <button className="btn btn-ghost btn-sm w-full">Muuta lapseksi</button>
                        </form>
                      )}
                      <form action={deleteMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="btn btn-ghost btn-sm w-full text-berry">Poista {m.name}</button>
                      </form>
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
          {isParent && <AddMemberForm />}
        </section>
      )}

      <section className="card space-y-2 p-4 text-sm">
        <h2 className="text-lg font-black">📲 Kotivalikkoon</h2>
        <p><b>iPhone:</b> avaa sivu Safarissa → <b>Jaa</b> ⬆️ → <b>Lisää Koti-valikkoon</b>.</p>
        <p><b>Android:</b> avaa sivu Chromessa → valikko ⋮ → <b>Asenna sovellus</b> / <b>Lisää aloitusnäyttöön</b>.</p>
      </section>
    </div>
  );
}
