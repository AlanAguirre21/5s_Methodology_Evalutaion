import { useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';
import { Select } from './Input.jsx';
import MenuOption from './MenuOption.jsx';

export default function CatalogSelect({ id, value, onChange, entries, placeholder, tab }) {
  const navigate = useNavigate();
  const loading = entries === null;
  const empty = entries?.length === 0;

  return (
    <>
      <Select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={loading || empty} className="py-2">
        <option value="">{loading ? 'Cargando…' : empty ? 'Sin registros' : placeholder}</option>
        {entries?.map(e => <option key={e._id} value={e.value}>{e.value}</option>)}
      </Select>
      {empty && (
        <div className="mt-1">
          <MenuOption icon={<UserPlus size={16} />} color="accent" onClick={() => navigate(`/personas?tab=${tab}`)}>
            Registrar en elementos de auditoría
          </MenuOption>
        </div>
      )}
    </>
  );
}
