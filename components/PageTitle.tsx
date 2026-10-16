export function PageTitle({ emoji, title, children }: { emoji: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-3xl font-black">
        <span>{emoji}</span>
        {title}
      </h1>
      {children}
    </div>
  );
}
