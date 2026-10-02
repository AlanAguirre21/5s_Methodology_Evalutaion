import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import { Input, Label } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser } from '../../api/users.js';
import { ROLES } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';

// Self-registration from the login page. Admins add users (and choose roles) in UsersPage.
export default function NewUserPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  if (user && !submitting) return <Navigate to={user.role === ROLES.ADMIN ? '/usuarios' : '/'} replace />;

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const isValid = cleanName.length >= 3;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const newUser = await createUser({ name: cleanName });
      await login(newUser.name);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <ArrowLeft size={16} /> Iniciar sesión
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="neu-raised flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent">
          <UserPlus size={20} />
        </span>
        <div>
          <p className="text-xs font-medium text-text-muted">Evaluación 5S</p>
          <h1 className="text-xl font-semibold text-text">Crear usuario</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 p-6 ${PANEL}`}>
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="mt-1 text-xs text-text-faint">
            Con este nombre se inicia sesión. No importan mayúsculas ni acentos.
          </p>
        </div>

        {error && <StatusMessage error={error} />}

        <Button type="submit" size="lg" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Creando…' : 'Crear usuario'}
        </Button>
      </form>
    </PageContainer>
  );
}
