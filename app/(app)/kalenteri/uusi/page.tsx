import { PageTitle } from "@/components/PageTitle";
import { isDate, today } from "@/lib/dates";
import { getMembers } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { EventForm } from "../EventForm";

export default async function UusiTapahtuma({ searchParams }: { searchParams: Promise<{ pv?: string }> }) {
  const me = await requireMember();
  const { pv } = await searchParams;
  const members = await getMembers(me.family_id);
  return (
    <div>
      <PageTitle emoji="✨" title="Uusi tapahtuma" />
      <EventForm date={isDate(pv) ? pv : today()} members={members.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }))} />
    </div>
  );
}
