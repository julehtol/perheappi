import { PageTitle } from "@/components/PageTitle";
import { getMembers, getShoppingItems, getShoppingSuggestions } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { QuickAdd, SuggestionChips } from "./QuickAdd";
import { ShoppingList } from "./ShoppingList";

export default async function Ostokset() {
  const me = await requireMember();
  const [items, members, suggestions] = await Promise.all([
    getShoppingItems(me.family_id),
    getMembers(me.family_id),
    getShoppingSuggestions(me.family_id),
  ]);
  const onList = new Set(items.filter((i) => !i.done).map((i) => i.name.toLowerCase()));
  const sugg = suggestions.filter((s) => !onList.has(s.toLowerCase()));

  return (
    <div className="space-y-4">
      <PageTitle emoji="🛒" title="Ostoslista" />
      <QuickAdd suggestions={sugg} />
      <ShoppingList items={items} members={members.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }))} />
      <SuggestionChips suggestions={sugg} />
    </div>
  );
}
