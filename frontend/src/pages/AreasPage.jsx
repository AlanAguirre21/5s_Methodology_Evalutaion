import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Button from '../components/Button.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import AreaModal from '../components/ui/AreaModal.jsx';
import { Input } from '../components/Input.jsx';
import { createArea, deleteArea, listAreas, updateArea } from '../api/areas.js';
import { PANEL } from '../constants/styles.js';

const DANGER_OUTLINE = 'neu-raised bg-white/60 text-danger border border-white/50 hover:bg-danger/10';

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

export default function AreasPage() {
  const [areas, setAreas]   = useState(null);   // null = loading
  const [error, setError]   = useState(null);
  const [query, setQuery]   = useState('');
  const [editing, setEditing] = useState(false);   // false | { area } (area null = new)
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy]     = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [notice, setNotice] = useState(null);   // { tone, text }

  useEffect(() => {
    let active = true;
    listAreas()
      .then(items => { if (active) setAreas(items); })
      .catch(e => { if (active) { setAreas([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return (areas ?? [])
      .filter(a => !q || [a.name, a.costCenter, a.manager?.name, a.manager?.email].some(v => v && normalize(v).includes(q)));
  }, [areas, query]);

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

  async function remove(area) {
    setBusy(true);
    setConfirmError(null);
    try {
      await deleteArea(area.id);
      setAreas(list => list.filter(a => a.id !== area.id));
      setDeleting(null);
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer size="xl">
      <AreaModal open={editing} onSave={save} onClose={() => setEditing(false)} />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Eliminar área"
        confirmLabel="Eliminar"
        busy={busy}
        error={confirmError}
        onConfirm={() => remove(deleting)}
        onCancel={() => { setDeleting(null); setConfirmError(null); }}
      >
        ¿Seguro que quieres eliminar <strong>{deleting?.name}</strong>? Ya no aparecerá en los formularios de evaluación y no se puede deshacer.
        Las evaluaciones anteriores se conservan con el área, el centro de coste y la persona evaluada que tenían.
      </ConfirmModal>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Áreas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Las áreas aparecen en los formularios de piso y de oficina. Su responsable es la persona evaluada.
          </p>
        </div>
        <Button variant="primary" onClick={() => setEditing({ area: null })}>
          <Plus size={16} /> Nueva área
        </Button>
      </div>

      <div className={`mt-6 p-5 ${PANEL}`}>
        <div className="relative">
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
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/80 text-xs text-text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Área</th>
                  <th className="px-4 py-2.5 font-medium">Centro de coste</th>
                  <th className="px-4 py-2.5 font-medium">Responsable</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-faint">
                      {query.trim() ? `Sin resultados para "${query.trim()}".` : 'No hay áreas registradas.'}
                    </td>
                  </tr>
                ) : rows.map(a => (
                  <tr key={a.id} className="border-t border-white/40 hover:bg-white/50">
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
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setEditing({ area: a })} aria-label={`Editar ${a.name}`}>
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button size="sm" onClick={() => setDeleting(a)} aria-label={`Eliminar ${a.name}`} title="Eliminar" variant={DANGER_OUTLINE}>
                          <Trash2 size={14} />
                        </Button>
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
