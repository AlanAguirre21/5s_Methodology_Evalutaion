export default function ProgressBar({ answered, total }) {
  const percent = total ? (answered / total) * 100 : 0;
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">{answered} de {total} respondidas</p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}