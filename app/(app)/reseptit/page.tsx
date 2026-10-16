import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { getRecipes } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { RecipeSearch } from "./RecipeSearch";

export default async function Reseptit() {
  const me = await requireMember();
  const recipes = await getRecipes(me.family_id);
  return (
    <div className="space-y-4">
      <PageTitle emoji="📖" title="Reseptit">
        <Link href="/reseptit/uusi" className="btn btn-sm">+ Uusi</Link>
      </PageTitle>
      {recipes.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-5xl">👵📖</div>
          <p className="mt-2 font-bold">Perheen reseptikirja on vielä tyhjä</p>
          <p className="text-sm text-muted">Tallenna tänne mummon pullaohje ja perheen lempiruoat.</p>
          <Link href="/reseptit/uusi" className="btn mt-4">Lisää ensimmäinen resepti</Link>
        </div>
      ) : (
        <RecipeSearch recipes={recipes.map(({ id, title, emoji, minutes, ingredients }) => ({ id, title, emoji, minutes, ingredients }))} />
      )}
    </div>
  );
}
