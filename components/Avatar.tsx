import type { Member } from "@/lib/types";

export function Avatar({ member, size = 32 }: { member?: Pick<Member, "emoji" | "color" | "name"> | null; size?: number }) {
  if (!member) return null;
  return (
    <span
      title={member.name}
      className="inline-grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.55, background: `${member.color}26`, boxShadow: `inset 0 0 0 2px ${member.color}` }}
    >
      {member.emoji}
    </span>
  );
}
