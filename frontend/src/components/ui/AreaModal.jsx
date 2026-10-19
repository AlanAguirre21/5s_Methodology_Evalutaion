import { useEffect, useRef, useState } from 'react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Input, Label } from '../Input.jsx';
import { EMAIL_PATTERN } from '../../constants/users.js';

const clean = value => value.trim().replace(/\s+/g, ' ');

function AreaForm({ area, initialName = '', onSave, onCancel }) {
  const [name, setName]               = useState(area?.name ?? initialName);
  const [costCenter, setCostCenter]   = useState(area?.costCenter ?? '');
  const [managerName, setManagerName] = useState(area?.manager?.name ?? '');
  const [managerEmail, setManagerEmail] = useState(area?.manager?.email ?? '');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  const data = {
    name: clean(name),
    costCenter: costCenter.trim(),
    manager: { name: clean(managerName), email: managerEmail.trim().toLowerCase() },
  };
  const isValid = data.name.length >= 2 && data.manager.name.length >= 3 && EMAIL_PATTERN.test(data.manager.email);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(data);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 id="area-modal-title" className="text-lg font-semibold text-text">{area ? 'Editar área' : 'Nueva área'}</h2>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="area-name">Nombre del área</Label>
          <Input id="area-name" value={name} onChange={e => setName(e.target.value)} maxLength={80} autoFocus autoComplete="off" placeholder="p. ej. Mantenimiento" />
        </div>
        <div>
          <Label htmlFor="area-cost-center">Centro de coste <span className="font-normal text-text-faint">(opcional)</span></Label>
          <Input id="area-cost-center" value={costCenter} onChange={e => setCostCenter(e.target.value)} maxLength={100} autoComplete="off" placeholder="Sin centro de coste" />
        </div>

        <fieldset className="space-y-4 border-t border-white/60 pt-4">
          <legend className="pr-2 text-sm font-medium text-text">Responsable</legend>
          <div>
            <Label htmlFor="area-manager-name">Nombre</Label>
            <Input id="area-manager-name" value={managerName} onChange={e => setManagerName(e.target.value)} maxLength={100} autoComplete="off" placeholder="p. ej. Juan Pérez" />
          </div>
          <div>
            <Label htmlFor="area-manager-email">Correo</Label>
            <Input id="area-manager-email" type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} maxLength={254} autoComplete="off" spellCheck={false} placeholder="p. ej. juan.perez@zf.com" aria-describedby="area-manager-hint" />
            <p id="area-manager-hint" className="mt-1 text-xs text-text-faint">
              Si no tiene cuenta, se le crea una con rol Usuario para que vea sus evaluaciones con este correo.
            </p>
          </div>
        </fieldset>
      </div>

      {error && <div className="mt-4"><StatusMessage error={error} /></div>}

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={!isValid || busy}>
          {busy ? 'Guardando…' : area ? 'Guardar cambios' : 'Agregar área'}
        </Button>
      </div>
    </form>
  );
}

// open: false | { area, name? } (area null = new; name prefills a new area)
export default function AreaModal({ open, onSave, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="area-modal-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      {open && <AreaForm key={open.area?.id ?? 'new'} area={open.area} initialName={open.name} onSave={onSave} onCancel={onClose} />}
    </dialog>
  );
}
