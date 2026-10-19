import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import { Input, Label } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser } from '../../api/users.js';
import { ROLES } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';
import { EMAIL_PATTERN } from '../../constants/users.js';

// Self-registration from the login page. Admins add users (and choose roles) in UsersPage.
export default function NewUserPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  if (user && !submitting) return <Navigate to={user.role === ROLES.ADMIN ? '/usuarios' : '/'} replace />;

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanEmail = email.trim().toLowerCase();
  const isValid = cleanName.length >= 3 && EMAIL_PATTERN.test(cleanEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const newUser = await createUser({ name: cleanName, email: cleanEmail });
      await login(newUser.email);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className={`mt-4 p-6 sm:mt-8 sm:p-8 ${PANEL}`}>
        <hgroup className="flex flex-col items-center border-b border-white/60 pb-6 text-center">
          <p className="text-xs font-semibold leading-none tracking-wide text-zf-blue sm:text-sm">
            ZF ESL
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-semibold text-text sm:text-4xl">
            <img src="/ZF_logo.svg" alt="" className="size-[1em] object-contain" />
            Evaluación 5S
          </h1>
          <h2 className="mt-3 text-base font-medium text-text-muted">Crear usuario</h2>
        </hgroup>

        <div className="mt-6">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
            className="py-2"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            spellCheck={false}
            placeholder="p. ej. juan.perez@zf.com"
            aria-describedby="email-hint"
            className="py-2"
          />
          <p id="email-hint" className="mt-1 text-xs text-text-faint">
            Con este correo se inicia sesión.
          </p>
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <Button type="submit" size="lg" className="mt-6" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Creando…' : 'Crear usuario'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        ¿Ya estás registrado?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">Inicia sesión</Link>
      </p>
    </PageContainer>
  );
}
