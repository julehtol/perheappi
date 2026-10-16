import { redirect } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { getFamily, getMembers } from "@/lib/queries";
import { getFamilyId, getMember } from "@/lib/session";
import { CreateFamilyForm, JoinForm, ProfilePicker } from "./forms";
import { leaveFamilyAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Aloitus({ searchParams }: { searchParams: Promise<{ virhe?: string }> }) {
  if (!hasDatabase()) return <NoDatabase />;
  if (await getMember()) redirect("/");
  const { virhe } = await searchParams;
  const familyId = await getFamilyId();
  const family = familyId ? await getFamily(familyId) : null;

  if (family) {
    const members = await getMembers(family.id);
    return (
      <Shell>
        <h1 className="text-3xl font-black">Kuka sinä olet?</h1>
        <p className="mt-1 text-muted">Perhe {family.name}</p>
        <ProfilePicker members={members.map(({ id, name, emoji, color, role, has_pin }) => ({ id, name, emoji, color, role, has_pin }))} />
        <form action={leaveFamilyAction} className="mt-10 text-center">
          <button className="text-sm font-bold text-muted underline">Liity toiseen perheeseen</button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <div className="text-6xl">🏡</div>
        <h1 className="mt-2 text-4xl font-black">Perheappi</h1>
        <p className="mt-2 text-muted">Ostoslista, ruokalista, reseptit ja kalenteri – koko perheelle yhdessä.</p>
      </div>
      <section className="card mt-8 p-5">
        <h2 className="text-xl font-black">Liity perheeseen</h2>
        <p className="mb-3 text-sm text-muted">Sait kutsukoodin tai -linkin perheenjäseneltä.</p>
        {virhe === "koodi" && <p className="mb-3 rounded-xl bg-berry-soft px-3 py-2 text-sm font-semibold text-berry">Kutsulinkki ei ole enää voimassa.</p>}
        <JoinForm />
      </section>
      <section className="card mt-4 p-5">
        <h2 className="text-xl font-black">Luo uusi perhe</h2>
        <p className="mb-3 text-sm text-muted">Sinusta tulee perheen ensimmäinen vanhempi. Voit kutsua muut myöhemmin.</p>
        <CreateFamilyForm />
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-md px-4 pb-16 pt-safe"><div className="pt-10">{children}</div></main>;
}

function NoDatabase() {
  return (
    <Shell>
      <div className="card p-6">
        <div className="text-5xl">🔌</div>
        <h1 className="mt-2 text-2xl font-black">Tietokanta puuttuu</h1>
        <p className="mt-2 text-muted">
          Lisää Vercel-projektiin Postgres-tietokanta (Storage → Create Database → Neon). Se asettaa
          <code className="mx-1 rounded bg-brand-soft px-1">DATABASE_URL</code>-muuttujan automaattisesti. Julkaise sen jälkeen sovellus uudelleen.
        </p>
      </div>
    </Shell>
  );
}
