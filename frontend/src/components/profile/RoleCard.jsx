import { useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import Button from '../Button.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import { updateUserRole } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';

const ROLE_DESCRIPTIONS = {
  admin: 'Puede realizar evaluaciones y gestionar los usuarios y sus roles.',
  user:  'Puede realizar evaluaciones y consultar los registros.',
};

// The role is read-only. Only an admin can change it, and changing their own asks first.
export default function RoleCard({ user, onSaved }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user.role === ROLES.ADMIN;
  const Icon = isAdmin ? ShieldCheck : User;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateUserRole(user.id, ROLES.USER);
      setConfirming(false);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="role-title" className={`p-6 ${PANEL}`}>
      <h2 id="role-title" className="font-semibold text-text">Rol</h2>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">{ROLE_LABELS[user.role]}</p>
          <p className="text-sm text-text-muted">{ROLE_DESCRIPTIONS[user.role]}</p>
        </div>
      </div>

      {isAdmin ? (
        <Button className="mt-4" onClick={() => { setError(null); setConfirming(true); }}>
          Cambiar mi rol a {ROLE_LABELS[ROLES.USER]}
        </Button>
      ) : (
        <p className="mt-4 text-xs text-text-faint">Solo un administrador puede cambiar tu rol.</p>
      )}

      <ConfirmModal
        open={confirming}
        title="¿Dejar de ser administrador?"
        confirmLabel={`Cambiar a ${ROLE_LABELS[ROLES.USER]}`}
        busy={busy}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      >
        Ya no podrás gestionar usuarios ni devolverte este rol tú mismo: otro administrador tendrá que asignártelo de nuevo.
      </ConfirmModal>
    </section>
  );
}
