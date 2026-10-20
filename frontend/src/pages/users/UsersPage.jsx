import { useEffect, useState } from 'react';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import UserProfileModal from '../../components/ui/UserProfileModal.jsx';
import UserAvatar from '../../components/profile/UserAvatar.jsx';
import { Input, Label, Select } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser, deleteUser, listUsers, updateUserRole } from '../../api/users.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { PANEL } from '../../constants/styles.js';
import { EMAIL_PATTERN } from '../../constants/users.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const DANGER_OUTLINE = 'neu-raised bg-white/60 text-danger border border-white/50 hover:bg-danger/10';

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
  const [deleting, setDeleting] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  useEffect(() => {
    let active = true;
    listUsers()
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

  async function remove(target) {
    setBusyId(target.id);
    setConfirmError(null);
    try {
      await deleteUser(target.id);
      setUsers(list => list.filter(u => u.id !== target.id));
      setDeleting(null);
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function deleteBlocker(u) {
    if (u.isSystem) return 'La cuenta de control no se puede eliminar';
    if (u.id === me.id) return 'No puedes eliminar tu propio usuario';
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
  const rows = users ?? [];
  const admins = rows.filter(u => u.role === ROLES.ADMIN).length;

  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Usuarios</h1>
      <p className="mt-1 text-sm text-text-muted">Agrega usuarios, edita su perfil, define quién es administrador y elimina a quien ya no deba entrar.</p>

      <div className="mt-6 space-y-4">
        <NewUserForm onCreated={created => setUsers(list => [...(list ?? []), created].sort(byName))} />

        {users === null && <StatusMessage loading />}
        {error && !confirmRole && <StatusMessage error={error} />}

        {users?.length > 0 && (
          <>
            <div className={`overflow-x-auto ${PANEL}`}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-white/60 text-xs text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Registrado</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(u => (
                    <tr key={u.id} className="border-b border-white/40 hover:bg-white/50">
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
                          disabled={u.isSystem || busyId === u.id || (u.role === ROLES.ADMIN && admins === 1)}
                          title={u.isSystem ? 'La cuenta de control siempre es administrador' : u.role === ROLES.ADMIN && admins === 1 ? 'Debe quedar al menos un administrador' : undefined}
                          aria-label={`Rol de ${u.name}`}
                        >
                          {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => setEditingId(u.id)} aria-label={`Ver perfil de ${u.name}`}>
                            <Pencil size={14} /> Perfil
                          </Button>
                          <Button
                            size="sm"
                            variant={DANGER_OUTLINE}
                            onClick={() => { setConfirmError(null); setDeleting(u); }}
                            disabled={Boolean(deleteBlocker(u)) || busyId === u.id}
                            title={deleteBlocker(u) ?? 'Eliminar'}
                            aria-label={`Eliminar ${u.name}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-text-muted">
              {rows.length} {rows.length === 1 ? 'usuario' : 'usuarios'} · {admins} {admins === 1 ? 'administrador' : 'administradores'}
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
        open={Boolean(deleting)}
        title="Eliminar usuario"
        confirmLabel="Eliminar"
        busy={busyId === deleting?.id}
        error={confirmError}
        onConfirm={() => remove(deleting)}
        onCancel={() => { setDeleting(null); setConfirmError(null); }}
      >
        ¿Seguro que quieres eliminar a <strong>{deleting?.name}</strong>? Ya no podrá iniciar sesión y no se puede deshacer.
        Las evaluaciones en las que participó se conservan.
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
