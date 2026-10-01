import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import { Input, Label, Select } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';

const USERNAME = /^[a-z0-9._-]{3,30}$/;

export default function NewUserPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === ROLES.ADMIN;   // only an admin chooses the role; everyone else registers a "user"

  const [username, setUsername] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState(ROLES.USER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);
  const [created, setCreated]   = useState(null);   // last user created while logged in

  const cleanUsername = username.trim().toLowerCase();
  const isValid = USERNAME.test(cleanUsername) && name.trim() !== '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);

    try {
      const newUser = await createUser({
        username: cleanUsername,
        name: name.trim(),
        ...(isAdmin ? { role } : {}),
      });

      if (!user) {
        // Self-registration: enter the app right away
        await login(newUser.username);
        navigate('/', { replace: true });
        return;
      }

      setCreated(newUser);
      setUsername('');
      setName('');
      setRole(ROLES.USER);
      setSubmitting(false);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <Link to={user ? '/' : '/login'} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <ArrowLeft size={16} /> {user ? 'Volver' : 'Iniciar sesión'}
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="neu-raised flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent">
          <UserPlus size={20} />
        </span>
        <div>
          <p className="text-xs font-medium text-text-muted">{user ? 'Usuarios' : 'Evaluación 5S'}</p>
          <h1 className="text-xl font-semibold text-text">{user ? 'Nuevo usuario' : 'Crear usuario'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 p-6 ${PANEL}`}>
        <div>
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={30}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="p. ej. jperez"
            aria-describedby="username-hint"
          />
          <p id="username-hint" className="mt-1 text-xs text-text-faint">
            De 3 a 30 caracteres: letras, números, punto, guion o guion bajo. Con él se inicia sesión.
          </p>
        </div>

        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
          />
        </div>

        {isAdmin && (
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select id="role" value={role} onChange={e => setRole(e.target.value)}>
              {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
          </div>
        )}

        {error && <StatusMessage error={error} />}

        {created && (
          <div role="status" className="glass rounded-control border border-success/25 bg-success/10 p-4 text-sm text-text">
            Usuario <strong>{created.username}</strong> creado ({ROLE_LABELS[created.role]}).
          </div>
        )}

        <Button type="submit" size="lg" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Creando…' : 'Crear usuario'}
        </Button>
      </form>
    </PageContainer>
  );
}
