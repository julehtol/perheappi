import { notFound } from "next/navigation";
import { deleteEvent } from "@/app/actions";
import { PageTitle } from "@/components/PageTitle";
import { getEvent, getMembers } from "@/lib/queries";
import { requireMember } from "@/lib/session";
import { EventForm } from "../EventForm";

export default async function MuokkaaTapahtumaa({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const event = await getEvent(me.family_id, Number((await params).id) || 0);
  if (!event) notFound();
  const members = await getMembers(me.family_id);
  const canDelete = me.role === "parent" || event.created_by === me.id || event.created_by === null;
  return (
    <div className="space-y-4">
      <PageTitle emoji={event.emoji} title="Tapahtuma" />
      <EventForm event={event} date={event.date} members={members.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }))} />
      {canDelete && (
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <button className="btn btn-ghost w-full text-berry">🗑️ Poista tapahtuma</button>
        </form>
      )}
    </div>
  );
}
