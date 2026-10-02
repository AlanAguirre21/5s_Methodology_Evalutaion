import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import PageContainer from './layout/PageContainer.jsx';
import StatusMessage from './StatusMessage.jsx';
import CatalogSelect from './CatalogSelect.jsx';
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

export default function FloorForm({ option, catalog, onSubmit, submitting, error }) {
  const [centroCoste, setCentroCoste] = useState('');
  const [area, setArea]               = useState('');
  const [supervisor, setSupervisor]   = useState('');
  const [personaEvaluada, setPersonaEvaluada] = useState('');

  const { title, Icon } = option;
  const isValid = [centroCoste, area, supervisor, personaEvaluada].every(v => v.trim() !== '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({
      costCenter: centroCoste.trim(),
      area: area.trim(),
      supervisor: supervisor.trim(),
      evaluatedPerson: personaEvaluada.trim(),
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
        <Field label="Centro de coste" htmlFor="centro_coste">
          <CatalogSelect
            id="centro_coste"
            value={centroCoste}
            onChange={setCentroCoste}
            entries={catalog?.costCenter ?? null}
            placeholder="Selecciona centro de coste"
            tab="piso"
          />
        </Field>

        <Field label="Área" htmlFor="area">
          <CatalogSelect
            id="area"
            value={area}
            onChange={setArea}
            entries={catalog?.area ?? null}
            placeholder="Selecciona área"
            tab="piso"
          />
        </Field>

        <Field label="Supervisor" htmlFor="supervisor">
          <CatalogSelect
            id="supervisor"
            value={supervisor}
            onChange={setSupervisor}
            entries={catalog?.supervisor ?? null}
            placeholder="Selecciona supervisor"
            tab="piso"
          />
        </Field>

        <Field label="Persona evaluada" htmlFor="persona_evaluada">
          <CatalogSelect
            id="persona_evaluada"
            value={personaEvaluada}
            onChange={setPersonaEvaluada}
            entries={catalog?.evaluatedPerson ?? null}
            placeholder="Selecciona persona evaluada"
            tab="piso"
          />
        </Field>

        {error && <StatusMessage error={error} />}

        <Button type="submit" size="lg" variant={ACCENT_THEME.button} disabled={!isValid || submitting}>
          {submitting ? 'Iniciando…' : 'Iniciar auditoría'}
        </Button>
      </form>
    </PageContainer>
  );
}
