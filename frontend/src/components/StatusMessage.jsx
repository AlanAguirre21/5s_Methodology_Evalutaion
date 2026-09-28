export default function StatusMessage({ loading, error }) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">Cargando…</p>;
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
        {error}
      </div>
    );
  }
  return null;
}