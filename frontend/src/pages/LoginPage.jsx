import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { LogIn } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Button from '../components/Button.jsx';
import { Input, Label } from '../components/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { PANEL } from '../constants/styles.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [name, setName]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;

  const isValid = name.trim() !== '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await login(name.trim());
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3">
        <span className="neu-raised flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent">
          <LogIn size={20} />
        </span>
        <div>
          <p className="text-xs font-medium text-text-muted">Evaluación 5S</p>
          <h1 className="text-xl font-semibold text-text">Iniciar sesión</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 p-6 ${PANEL}`}>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
            autoComplete="name"
            spellCheck={false}
            placeholder="Tu nombre completo"
          />
        </div>

        {error && <StatusMessage error={error} />}

        <Button type="submit" size="lg" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        ¿Aún no estás registrado?{' '}
        <Link to="/usuarios/nuevo" className="font-medium text-accent hover:underline">Regístrate</Link>
      </p>
    </PageContainer>
  );
}
