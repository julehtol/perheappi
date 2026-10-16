import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { getRecipe } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { RecipeForm } from "../../RecipeForm";

export default async function MuokkaaReseptia({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const recipe = await getRecipe(me.family_id, Number((await params).id) || 0);
  if (!recipe) notFound();
  return (
    <div>
      <PageTitle emoji="✏️" title="Muokkaa" />
      <RecipeForm recipe={recipe} />
    </div>
  );
}
