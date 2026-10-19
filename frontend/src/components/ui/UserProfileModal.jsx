import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X } from 'lucide-react';
import AvatarEditor from '../profile/AvatarEditor.jsx';
import PersonalInfoCard from '../profile/PersonalInfoCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { updateUser } from '../../api/users.js';

export default function UserProfileModal({ user, onSaved, onClose }) {
  const ref = useRef(null);
  const { user: me, updateUser: updateSession } = useAuth();

  useEffect(() => {
    const dialog = ref.current;
    if (user && !dialog.open) dialog.showModal();
    if (!user && dialog.open) dialog.close();
  }, [user]);

  function handleSaved(updated) {
    if (updated.id === me.id) updateSession(updated);
    onSaved(updated);
  }

  const own = user?.id === me.id;
  const locked = Boolean(user?.isSystem) && !own;
  const update = data => updateUser(user.id, data);

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="user-profile-modal-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      onSubmit={e => e.stopPropagation()}
      className="m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      {user && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                <ShieldCheck size={14} /> {locked ? 'Cuenta de control · solo lectura' : 'Editando como administrador'}
              </p>
              <h2 id="user-profile-modal-title" className="mt-2 truncate text-xl font-semibold text-text">
                Perfil de {user.name}
              </h2>
              <p className="text-sm text-text-muted">
                {locked
                  ? 'Solo esta cuenta puede cambiar su nombre y su foto.'
                  : own ? 'Este es tu propio usuario.' : 'Los cambios se aplican a este usuario, no a tu perfil.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-control p-1.5 text-text-muted hover:bg-white/60 hover:text-text"
            >
              <X size={18} />
            </button>
          </div>

          <div key={user.id} className="mt-5 grid items-start gap-4 md:grid-cols-[16rem_1fr]">
            <AvatarEditor user={user} onSaved={handleSaved} update={update} readOnly={locked} />
            <PersonalInfoCard user={user} onSaved={handleSaved} update={update} own={own} />
          </div>
        </div>
      )}
    </dialog>,
    document.body,
  );
}
