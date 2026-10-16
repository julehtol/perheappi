"use client";

import { useFormStatus } from "react-dom";

export function Submit({ children, className = "btn", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingText ?? "Hetki…") : children}
    </button>
  );
}

export function FormError({ state }: { state?: { error?: string } }) {
  if (!state?.error) return null;
  return <p className="rounded-xl bg-berry-soft px-3 py-2 text-sm font-semibold text-berry">{state.error}</p>;
}
