import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Power, Search } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Button from '../components/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import AreaModal from '../components/ui/AreaModal.jsx';
import { Input } from '../components/Input.jsx';
import { createArea, listAreas, setAreaActive, updateArea } from '../api/areas.js';
import { PANEL } from '../constants/styles.js';

const DANGER_OUTLINE  = 'neu-raised bg-white/60 text-danger border border-white/50 hover:bg-danger/10';
const SUCCESS_OUTLINE = 'neu-raised bg-white/60 text-success border border-white/50 hover:bg-success/10';

const normalize = str => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

function accountNotice({ status, takenBy }, manager) {
  const who = `${manager.name} (${manager.email})`;
  if (status === 'created') return { tone: 'success', text: `Se creó la cuenta de ${who}. Ya puede iniciar sesión con su correo.` };
  if (status === 'linked') return { tone: 'success', text: `Se agregó el correo a la cuenta existente de ${manager.name}.` };
  if (status === 'skipped') return { tone: 'warning', text: `No se creó la cuenta de ${who}: el nombre ya lo usa otro usuario (${takenBy}). Corrígelo en Usuarios.` };
  return null;
}

const NOTICE_TONES = {
  success: 'border-success/25 bg-success/10',
  warning: 'border-warning/25 bg-warning/15',
};

function StatusBadge({ active }) {
  return active ? (
    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-success/25">Activa</span>
  ) : (
    <span className="rounded-full border border-white/60 bg-white/60 px-2 py-0.5 text-xs font-medium text-text-muted">Inactiva</span>
  );
}

export default function AreasPage() {
  const [areas, setAreas]   = useState(null);   // null = loading
  const [error, setError]   = useState(null);
  const [query, setQuery]   = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(false);   // false | { area } (area null = new)
  const [deactivating, setDeactivating] = useState(null);
  const [busy, setBusy]     = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [notice, setNotice] = useState(null);   // { tone, text }

  useEffect(() => {
    let active = true;
    listAreas({ all: true })
      .then(items => { if (active) setAreas(items); })
      .catch(e => { if (active) { setAreas([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  const inactiveCount = areas?.filter(a => !a.active).length ?? 0;
  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return (areas ?? [])
      .filter(a => showInactive || a.active)
      .filter(a => !q || [a.name, a.costCenter, a.manager?.name, a.manager?.email].some(v => v && normalize(v).includes(q)));
  }, [areas, query, showInactive]);

  function replace(area) {
    setAreas(list => [...list.filter(a => a.id !== area.id), area].sort(byName));
  }

  async function save(data) {
    const area = editing.area;
    const { managerAccount, ...saved } = area ? await updateArea(area.id, data) : await createArea(data);
    replace(saved);
    setEditing(false);
    setNotice(managerAccount ? accountNotice(managerAccount, saved.manager) : null);
  }

  async function changeActive(area, active) {
    setBusy(true);
    setError(null);
    setConfirmError(null);
    try {
      replace(await setAreaActive(area.id, active));
      setDeactivating(null);
    } catch (err) {
      (active ? setError : setConfirmError)(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer size="xl">
      <AreaModal open={editing} onSave={save} onClose={() => setEditing(false)} />
      <ConfirmModal
        open={Boolean(deactivating)}
        title="Desactivar área"
        confirmLabel="Desactivar"
        busy={busy}
        error={confirmError}
        onConfirm={() => changeActive(deactivating, false)}
        onCancel={() => { setDeactivating(null); setConfirmError(null); }}
      >
        ¿Seguro que quieres desactivar <strong>{deactivating?.name}</strong>? Ya no aparecerá en los formularios de evaluación.
        Las evaluaciones anteriores no cambian y puedes volver a activarla cuando quieras.
      </ConfirmModal>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Áreas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Las áreas activas aparecen en los formularios de piso y de oficina. Su responsable es la persona evaluada.
          </p>
        </div>
        <Button variant="primary" onClick={() => setEditing({ area: null })}>
          <Plus size={16} /> Nueva área
        </Button>
      </div>

      <div className={`mt-6 p-5 ${PANEL}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search size={14} className="pointer-events-none absolute inset-y-0 left-2.5 my-auto text-text-faint" />
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por área, centro de coste o responsable"
              aria-label="Buscar áreas"
              className="pl-8"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-accent" />
            Mostrar inactivas ({inactiveCount})
          </label>
        </div>

        {notice && (
          <div role="status" className={`glass mt-4 flex items-start justify-between gap-3 rounded-control border p-3 text-sm text-text ${NOTICE_TONES[notice.tone]}`}>
            <p>{notice.text}</p>
            <button type="button" onClick={() => setNotice(null)} className="shrink-0 text-xs font-medium text-text-muted hover:text-text">Cerrar</button>
          </div>
        )}
        {error && <div className="mt-4"><StatusMessage error={error} /></div>}
        {areas === null && <StatusMessage loading />}

        {areas && (
          <div className="mt-4 overflow-x-auto rounded-control border border-border bg-white/40">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/80 text-xs text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Área</th>
                  <th className="px-4 py-2.5 font-medium">Centro de coste</th>
                  <th className="px-4 py-2.5 font-medium">Responsable</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-faint">
                      {query.trim() ? `Sin resultados para "${query.trim()}".` : 'No hay áreas registradas.'}
                    </td>
                  </tr>
                ) : rows.map(a => (
                  <tr key={a.id} className={`border-t border-white/40 hover:bg-white/50 ${a.active ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-2.5 font-medium text-text">{a.name}</td>
                    <td className={`px-4 py-2.5 ${a.costCenter ? 'text-text' : 'text-text-faint'}`}>{a.costCenter || '—'}</td>
                    <td className="px-4 py-2.5">
                      {a.manager ? (
                        <>
                          <p className="text-text">{a.manager.name}</p>
                          <p className="text-xs text-text-muted">{a.manager.email}</p>
                        </>
                      ) : (
                        <span className="text-danger">Sin responsable</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge active={a.active} /></td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setEditing({ area: a })} aria-label={`Editar ${a.name}`}>
                          <Pencil size={14} /> Editar
                        </Button>
                        {a.active ? (
                          <Button size="sm" onClick={() => setDeactivating(a)} aria-label={`Desactivar ${a.name}`} variant={DANGER_OUTLINE}>
                            <Power size={14} /> Desactivar
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => changeActive(a, true)} disabled={busy} aria-label={`Activar ${a.name}`} variant={SUCCESS_OUTLINE}>
                            <Power size={14} /> Activar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
