import { Link } from 'react-router';
import UserAvatar from './profile/UserAvatar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { TILE } from '../constants/styles.js';

export default function SupervisingPerson() {
  const { user } = useAuth();

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-text-muted">Supervisor</p>
      <div className={`flex items-center gap-3 px-3 py-2 ${TILE}`}>
        <UserAvatar user={user} size={36} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{user.name}</span>
        <Link to="/perfil" className="shrink-0 text-xs font-medium text-accent hover:underline">
          Ver mi información
        </Link>
      </div>
    </div>
  );
}
