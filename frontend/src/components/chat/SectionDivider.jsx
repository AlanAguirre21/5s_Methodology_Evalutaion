export default function SectionDivider({ name }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-slate-300" />
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{name}</span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}