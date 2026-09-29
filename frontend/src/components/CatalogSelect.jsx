import { Link } from 'react-router';

export default function CatalogSelect({ id, value, onChange, entries, placeholder, tab, className }) {
  const loading = entries === null;
  const empty = entries?.length === 0;

  return (
    <>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading || empty}
        className={`${className} disabled:bg-slate-50 disabled:text-slate-400`}
      >
        <option value="">{loading ? 'Cargando…' : empty ? 'Sin registros' : placeholder}</option>
        {entries?.map(e => <option key={e._id} value={e.value}>{e.value}</option>)}
      </select>
      {empty && (
        <p className="mt-1 text-xs text-slate-500">
          Regístralos en{' '}
          <Link to={`/personas?tab=${tab}`} className="font-medium text-slate-700 underline hover:text-slate-900">
            Registro de personas
          </Link>.
        </p>
      )}
    </>
  );
}
