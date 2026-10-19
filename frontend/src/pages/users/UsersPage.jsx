import { useEffect, useState } from 'react';
import { Pencil, Power, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import UserProfileModal from '../../components/ui/UserProfileModal.jsx';
import UserAvatar from '../../components/profile/UserAvatar.jsx';
import { Input, Label, Select } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser, listUsers, setUserActive, updateUserRole } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';
import { EMAIL_PATTERN } from '../../constants/users.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const DANGER_OUTLINE  = 'neu-raised bg-white/60 text-danger border border-white/50 hover:bg-danger/10';
const SUCCESS_OUTLINE = 'neu-raised bg-white/60 text-success border border-white/50 hover:bg-success/10';

function StatusBadge({ active }) {
  return active ? (
    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-success/25">Activo</span>
  ) : (
    <span className="rounded-full border border-white/60 bg-white/60 px-2 py-0.5 text-xs font-medium text-text-muted">Inactivo</span>
  );
}

function NewUserForm({ onCreated }) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState(ROLES.USER);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanEmail = email.trim().toLowerCase();
  const isValid = cleanName.length >= 3 && EMAIL_PATTERN.test(cleanEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    setCreated(null);

    try {
      const user = await createUser({ name: cleanName, email: cleanEmail, role });
      onCreated(user);
      setCreated(user);
      setName('');
      setEmail('');
      setRole(ROLES.USER);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="new-user-title" className={`p-5 ${PANEL}`}>
      <h2 id="new-user-title" className="font-semibold text-text">Nuevo usuario</h2>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor="new-user-name">Nombre completo</Label>
          <Input
            id="new-user-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="p. ej. Juan Pérez"
          />
        </div>
        <div className="min-w-56 flex-1">
          <Label htmlFor="new-user-email">Correo</Label>
          <Input
            id="new-user-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="off"
            spellCheck={false}
            placeholder="p. ej. juan.perez@zf.com"
          />
        </div>
        <div>
          <Label htmlFor="new-user-role">Rol</Label>
          <Select id="new-user-role" block={false} value={role} onChange={e => setRole(e.target.value)}>
            {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="primary" disabled={!isValid || busy}>
          <UserPlus size={16} /> {busy ? 'Agregando…' : 'Agregar'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-text-faint">El usuario inicia sesión con este correo.</p>

      {error && <div className="mt-3"><StatusMessage error={error} /></div>}
      {created && (
        <div role="status" className="glass mt-3 rounded-control border border-success/25 bg-success/10 p-3 text-sm text-text">
          Usuario <strong>{created.name}</strong> agregado ({ROLE_LABELS[created.role]}).
        </div>
      )}
    </section>
  );
}

export default function UsersPage() {
  const { user: me, updateUser } = useAuth();

  const [users, setUsers]   = useState(null);   
  const [error, setError]   = useState(null);
  const [busyId, setBusyId] = useState(null);   
  const [confirmRole, setConfirmRole] = useState(null);   
  const [editingId, setEditingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  useEffect(() => {
    let active = true;
    listUsers({ all: true })
      .then(items => { if (active) setUsers(items); })
      .catch(e => { if (active) { setUsers([]); setError(e.message); } });
    return () => { active = false; };
  }, []);

  async function saveRole(target, role) {
    setBusyId(target.id);
    setError(null);
    try {
      const updated = await updateUserRole(target.id, role);
      setUsers(list => list.map(u => (u.id === updated.id ? updated : u)));
      setConfirmRole(null);
      if (updated.id === me.id) updateUser(updated);   
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function changeActive(target, active) {
    setBusyId(target.id);
    setError(null);
    setConfirmError(null);
    try {
      const updated = await setUserActive(target.id, active);
      setUsers(list => list.map(u => (u.id === updated.id ? updated : u)));
      setDeactivating(null);
    } catch (err) {
      (active ? setError : setConfirmError)(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function deactivateBlocker(u) {
    if (u.isSystem) return 'La cuenta de control no se puede desactivar';
    if (u.id === me.id) return 'No puedes desactivar tu propio usuario';
    if (u.role === ROLES.ADMIN && admins === 1) return 'Debe quedar al menos un administrador';
    return null;
  }

  function handleRoleChange(target, role) {
    if (role === target.role) return;
    if (target.id === me.id) {
      setError(null);
      setConfirmRole(role);   
    } else {
      saveRole(target, role);
    }
  }

  const editing = users?.find(u => u.id === editingId) ?? null;
  const activeUsers = users?.filter(u => u.active) ?? [];
  const inactiveCount = (users?.length ?? 0) - activeUsers.length;
  const admins = activeUsers.filter(u => u.role === ROLES.ADMIN).length;
  const rows = showInactive ? users ?? [] : activeUsers;

  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
      <p className="mt-1 text-sm text-text-muted">Agrega usuarios, edita su perfil, define quién es administrador y desactiva a quien ya no deba entrar.</p>

      <div className="mt-6 space-y-4">
        <NewUserForm onCreated={created => setUsers(list => [...(list ?? []), created].sort(byName))} />

        {users === null && <StatusMessage loading />}
        {error && !confirmRole && <StatusMessage error={error} />}

        {users?.length > 0 && (
          <>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-accent" />
              Mostrar usuarios inactivos ({inactiveCount})
            </label>
            <div className={`overflow-x-auto ${PANEL}`}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-white/60 text-xs text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Registrado</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(u => (
                    <tr key={u.id} className={`border-b border-white/40 hover:bg-white/50 ${u.active ? '' : 'opacity-60'}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size={32} />
                          <div className="min-w-0">
                            <p className="font-medium text-text">{u.name}</p>
                            <p className={`truncate text-xs ${u.email ? 'text-text-muted' : 'text-danger'}`}>{u.email ?? 'Sin correo'}</p>
                          </div>
                          {u.isSystem && (
                            <span className="rounded-full bg-zf-blue/10 px-2 py-0.5 text-xs font-medium text-zf-blue">Control</span>
                          )}
                          {u.id === me.id && (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Tú</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{dateFormat.format(new Date(u.createdAt))}</td>
                      <td className="px-4 py-2.5">
                        <Select
                          block={false}
                          value={u.role}
                          onChange={e => handleRoleChange(u, e.target.value)}
                          disabled={!u.active || u.isSystem || busyId === u.id || (u.role === ROLES.ADMIN && admins === 1)}
                          title={u.isSystem ? 'La cuenta de control siempre es administrador' : u.role === ROLES.ADMIN && admins === 1 ? 'Debe quedar al menos un administrador' : undefined}
                          aria-label={`Rol de ${u.name}`}
                        >
                          {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge active={u.active} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          {u.active && (
                            <Button size="sm" onClick={() => setEditingId(u.id)} aria-label={`Ver perfil de ${u.name}`}>
                              <Pencil size={14} /> Perfil
                            </Button>
                          )}
                          {u.active ? (
                            <Button
                              size="sm"
                              variant={DANGER_OUTLINE}
                              onClick={() => { setConfirmError(null); setDeactivating(u); }}
                              disabled={Boolean(deactivateBlocker(u)) || busyId === u.id}
                              title={deactivateBlocker(u) ?? undefined}
                              aria-label={`Desactivar ${u.name}`}
                            >
                              <Power size={14} /> Desactivar
                            </Button>
                          ) : (
                            <Button size="sm" variant={SUCCESS_OUTLINE} onClick={() => changeActive(u, true)} disabled={busyId === u.id} aria-label={`Activar ${u.name}`}>
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
            <p className="text-sm text-text-muted">
              {activeUsers.length} {activeUsers.length === 1 ? 'usuario activo' : 'usuarios activos'} · {admins} {admins === 1 ? 'administrador' : 'administradores'}
              {inactiveCount > 0 && ` · ${inactiveCount} ${inactiveCount === 1 ? 'inactivo' : 'inactivos'}`}
            </p>
          </>
        )}
      </div>

      <UserProfileModal
        user={editing}
        onSaved={updated => setUsers(list => list.map(u => (u.id === updated.id ? updated : u)).sort(byName))}
        onClose={() => setEditingId(null)}
      />

      <ConfirmModal
        open={Boolean(deactivating)}
        title="Desactivar usuario"
        confirmLabel="Desactivar"
        busy={busyId === deactivating?.id}
        error={confirmError}
        onConfirm={() => changeActive(deactivating, false)}
        onCancel={() => { setDeactivating(null); setConfirmError(null); }}
      >
        ¿Seguro que quieres desactivar a <strong>{deactivating?.name}</strong>? Ya no podrá iniciar sesión ni aparecerá como usuario activo.
        Sus evaluaciones se conservan y puedes volver a activarlo cuando quieras.
      </ConfirmModal>

      <ConfirmModal
        open={confirmRole !== null}
        title="¿Dejar de ser administrador?"
        confirmLabel={`Cambiar a ${ROLE_LABELS[confirmRole] ?? ''}`}
        busy={busyId === me.id}
        error={confirmRole ? error : null}
        onConfirm={() => saveRole(me, confirmRole)}
        onCancel={() => { setConfirmRole(null); setError(null); }}
      >
        Saldrás de esta página y ya no podrás gestionar usuarios ni devolverte este rol tú mismo: otro administrador tendrá que asignártelo de nuevo.
      </ConfirmModal>
    </PageContainer>
  );
}
