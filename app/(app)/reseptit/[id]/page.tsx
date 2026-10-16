import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRecipe } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { addDays, today } from "@/lib/dates";
import { getMembers, getRecipe } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { Ingredients, RecipeActions } from "./client";

export default async function Resepti({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const recipe = await getRecipe(me.family_id, Number((await params).id) || 0);
  if (!recipe) notFound();
  const members = await getMembers(me.family_id);
  const author = members.find((m) => m.id === recipe.created_by);
  const lines = recipe.ingredients.split("\n").map((l) => l.trim()).filter(Boolean);
  const canDelete = me.role === "parent" || recipe.created_by === me.id;

  return (
    <article className="space-y-4">
      <Link href="/reseptit" className="text-sm font-bold text-muted">‹ Reseptit</Link>
      <header className="text-center">
        <div className="text-7xl">{recipe.emoji}</div>
        <h1 className="mt-2 text-3xl font-black leading-tight">{recipe.title}</h1>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm text-muted">
          {recipe.servings ? <span>🍽️ {recipe.servings} annosta</span> : null}
          {recipe.minutes ? <span>⏱️ {recipe.minutes} min</span> : null}
          {author && (
            <span className="flex items-center gap-1">
              <Avatar member={author} size={20} /> {author.name}
            </span>
          )}
        </div>
      </header>

      <RecipeActions recipeId={recipe.id} isParent={me.role === "parent"} defaultDate={addDays(today(), 1)} />

      {lines.length > 0 && <Ingredients lines={lines} title={recipe.title} />}

      {recipe.instructions && (
        <section className="card p-4">
          <h2 className="mb-2 text-lg font-black">👩‍🍳 Ohje</h2>
          <div className="whitespace-pre-wrap leading-relaxed">{recipe.instructions}</div>
        </section>
      )}

      {recipe.source_url && (
        <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-bold text-sky underline">
          🔗 {recipe.source_url}
        </a>
      )}

      <div className="flex gap-2 pt-2">
        <Link href={`/reseptit/${recipe.id}/muokkaa`} className="btn btn-ghost flex-1">✏️ Muokkaa</Link>
        {canDelete && (
          <form action={deleteRecipe} className="flex-1">
            <input type="hidden" name="id" value={recipe.id} />
            <button className="btn btn-ghost w-full text-berry">🗑️ Poista</button>
          </form>
        )}
      </div>
    </article>
  );
}
