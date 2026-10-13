import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import PageContainer from './layout/PageContainer.jsx';
import StatusMessage from './StatusMessage.jsx';
import CatalogSelect from './CatalogSelect.jsx';
import EvaluatedPersonSelect from './EvaluatedPersonSelect.jsx';
import SupervisingPerson from './SupervisingPerson.jsx';
import { useAuth } from '../hooks/useAuth.js';
import Button from './Button.jsx';
import { Label } from './Input.jsx';
import { PANEL, ACCENT_THEME } from '../constants/styles.js';

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export default function OfficeForm({ option, catalog, onSubmit, submitting, error }) {
  const [departamento, setDepartamento]       = useState('');
  const [taller, setTaller]                   = useState('');
  const [evaluatedPerson, setEvaluatedPerson] = useState('');
  const [evaluatedHasPhoto, setEvaluatedHasPhoto] = useState(false);

  const { user } = useAuth();

  const { title, Icon } = option;
  const isValid = Boolean(user.avatar) && evaluatedHasPhoto && [departamento, taller, evaluatedPerson].every(v => v.trim() !== '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({
      department: departamento.trim(),
      workshop: taller.trim(),
      evaluatedPerson: evaluatedPerson.trim(),
    });
  }

  return (
    <PageContainer>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className={`neu-raised flex h-10 w-10 items-center justify-center rounded-control ${ACCENT_THEME.icon}`}>
          <Icon size={20} />
        </span>
        <div>
          <p className="text-xs font-medium   text-text-muted">Nueva evaluación</p>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`mt-6 space-y-4 p-6 ${PANEL}`}>
        <Field label="Área/Departamento" htmlFor="departamento">
          <CatalogSelect
            id="departamento"
            value={departamento}
            onChange={setDepartamento}
            entries={catalog?.department ?? null}
            placeholder="Selecciona área/departamento"
            tab="oficina"
          />
        </Field>

        <Field label="Taller" htmlFor="taller">
          <CatalogSelect
            id="taller"
            value={taller}
            onChange={setTaller}
            entries={catalog?.workshop ?? null}
            placeholder="Selecciona taller"
            tab="oficina"
          />
        </Field>

        <Field label="Persona a evaluar" htmlFor="evaluatedPerson">
          <EvaluatedPersonSelect
            id="evaluatedPerson"
            value={evaluatedPerson}
            onChange={(name, person) => { setEvaluatedPerson(name); setEvaluatedHasPhoto(Boolean(person?.hasAvatar)); }}
            photoRequired
          />
        </Field>

        <SupervisingPerson photoRequired />

        {error && <StatusMessage error={error} />}

        <Button type="submit" size="lg" variant={ACCENT_THEME.button} disabled={!isValid || submitting}>
          {submitting ? 'Iniciando…' : 'Iniciar auditoría'}
        </Button>
      </form>
    </PageContainer>
  );
}
