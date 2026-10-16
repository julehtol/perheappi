import { PageTitle } from "@/components/PageTitle";
import { requireMember } from "@/lib/session";
import { RecipeForm } from "../RecipeForm";

export default async function UusiResepti() {
  await requireMember();
  return (
    <div>
      <PageTitle emoji="📝" title="Uusi resepti" />
      <RecipeForm />
    </div>
  );
}
