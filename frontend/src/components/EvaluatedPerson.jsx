import { Link } from 'react-router';
import { Camera } from 'lucide-react';
import UserAvatar from './profile/UserAvatar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { TILE } from '../constants/styles.js';

export default function EvaluatedPerson({ photoRequired = false }) {
  const { user } = useAuth();
  const missingPhoto = photoRequired && !user.avatar;

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-text-muted">Persona evaluada</p>
      <div className={`flex items-center gap-3 px-3 py-2 ${TILE}`}>
        <UserAvatar user={user} size={36} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{user.name}</span>
        <Link to="/perfil" className="shrink-0 text-xs font-medium text-accent hover:underline">
          Ver mi información
        </Link>
      </div>

      {missingPhoto && (
        <div role="alert" className="glass mt-2 rounded-control border border-warning/25 bg-warning/15 p-3 text-sm text-text">
          <p>Para la evaluación de oficina necesitas una foto tuya en tu perfil.</p>
          <Link to="/perfil" className="mt-1 inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            <Camera size={16} /> Subir mi foto en Mi perfil
          </Link>
        </div>
      )}
    </div>
  );
}
