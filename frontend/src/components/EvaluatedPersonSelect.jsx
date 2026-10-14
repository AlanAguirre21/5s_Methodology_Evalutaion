import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Camera, UserPlus } from 'lucide-react';
import { Select } from './Input.jsx';
import Button from './Button.jsx';
import UserProfileModal from './ui/UserProfileModal.jsx';
import PersonModal from './ui/PersonModal.jsx';
import UserAvatar from './profile/UserAvatar.jsx';
import { listUserNames, listUsers } from '../api/users.js';
import { TILE } from '../constants/styles.js';

const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

export default function EvaluatedPersonSelect({ id, value, onChange, photoRequired = false }) {
  const [users, setUsers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let active = true;
    const load = photoRequired
      ? listUsers().then(items => items.map(u => ({ id: u.id, name: u.name, role: u.role, avatar: u.avatar, hasAvatar: Boolean(u.avatar) })))
      : listUserNames();
    load
      .then(items => { if (active) setUsers(items); })
      .catch(() => { if (active) { setUsers([]); setFailed(true); } });
    return () => { active = false; };
  }, [photoRequired]);

  const loading = users === null;
  const empty = users?.length === 0;
  const placeholder = loading ? 'Cargando…'
    : failed ? 'No se pudieron cargar los usuarios'
    : empty ? 'Sin usuarios'
    : 'Selecciona a la persona a evaluar';

  const selected = users?.find(u => u.name === value);
  const missingPhoto = photoRequired && selected && !selected.hasAvatar;

  function handleSaved(updated) {
    const entry = { id: updated.id, name: updated.name, role: updated.role, avatar: updated.avatar, hasAvatar: Boolean(updated.avatar) };
    setUsers(list => list.map(u => (u.id === entry.id ? entry : u)).sort(byName));
    setEditing(updated);
    onChange(entry.name, entry);
  }

  return (
    <>
      <Select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value, users.find(u => u.name === e.target.value))}
        disabled={loading || empty}
        className="py-2"
      >
        <option value="">{placeholder}</option>
        {users?.map(u => (
          <option key={u.id} value={u.name}>{u.name}{photoRequired && !u.hasAvatar ? ' (sin foto)' : ''}</option>
        ))}
      </Select>

      {photoRequired && selected?.hasAvatar && (
        <div className={`mt-2 flex items-center gap-3 px-3 py-2 ${TILE}`}>
          <UserAvatar user={selected} size={36} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{selected.name}</span>
          <button type="button" onClick={() => setViewing(selected)} className="shrink-0 text-xs font-medium text-accent hover:underline">
            Ver su información
          </button>
        </div>
      )}

      {missingPhoto && (
        <div role="alert" className="glass mt-2 rounded-control border border-warning/25 bg-warning/15 p-3 text-sm text-text">
          <p>Para la evaluación de oficina, <strong>{selected.name}</strong> necesita una foto de perfil.</p>
          <Button size="sm" className="mt-2" onClick={() => setEditing({ id: selected.id, name: selected.name, avatar: null })}>
            <Camera size={14} /> Agregar su foto
          </Button>
        </div>
      )}

      <p className="mt-1 text-xs text-text-muted">
        ¿No encuentras a la persona?{' '}
        <Link to="/usuarios" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
          <UserPlus size={14} /> Agregar un usuario nuevo
        </Link>
      </p>

      <UserProfileModal user={editing} onSaved={handleSaved} onClose={() => setEditing(null)} />
      <PersonModal user={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
