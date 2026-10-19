import { useState } from 'react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';
import { Input, Label } from '../Input.jsx';
import { updateMe } from '../../api/users.js';
import { PANEL } from '../../constants/styles.js';
import { EMAIL_PATTERN } from '../../constants/users.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

export default function PersonalInfoCard({ user, onSaved, update = updateMe, own = true }) {
  const locked = user.isSystem && !own;   // only the control user can edit itself
  const emailLocked = locked || user.isSystem;
  const [name, setName]     = useState(user.name);
  const [email, setEmail]   = useState(user.email ?? '');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const [saved, setSaved]   = useState(false);

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanEmail = email.trim().toLowerCase();
  const nameChanged = cleanName !== user.name;
  const emailChanged = cleanEmail !== (user.email ?? '');
  const changed = nameChanged || emailChanged;
  const isValid = !locked && cleanName.length >= 3 && EMAIL_PATTERN.test(cleanEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!changed || !isValid || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await update({
        ...(nameChanged && { name: cleanName }),
        ...(emailChanged && { email: cleanEmail }),
      });
      onSaved(updated);
      setName(updated.name);
      setEmail(updated.email ?? '');
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="info-title" className={`p-6 ${PANEL}`}>
      <h2 id="info-title" className="font-semibold text-text">Información personal</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="profile-name">Nombre completo</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={e => { setName(e.target.value); setSaved(false); }}
            disabled={locked}
            maxLength={100}
            autoComplete={own ? 'name' : 'off'}
          />
        </div>

        <div>
          <Label htmlFor="profile-email">Correo</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setSaved(false); }}
            disabled={emailLocked}
            maxLength={254}
            autoComplete={own ? 'email' : 'off'}
            spellCheck={false}
            aria-describedby="profile-email-hint"
          />
          <p id="profile-email-hint" className="mt-1 text-xs text-text-faint">
            {user.isSystem
              ? 'El correo de la cuenta de control no se puede cambiar.'
              : own
              ? 'Es el correo con el que inicias sesión. Si lo cambias, usa el nuevo la próxima vez.'
              : user.email
                ? 'Es el correo con el que inicia sesión. Si lo cambias, avísale para que use el nuevo.'
                : 'Este usuario no tiene correo y no puede iniciar sesión hasta que se le asigne uno.'}
          </p>
        </div>

        {user.createdAt && (
          <div>
            <p className="mb-1 text-xs font-medium text-text-muted">Registrado desde</p>
            <p className="text-sm text-text">{dateFormat.format(new Date(user.createdAt))}</p>
          </div>
        )}

        {error && <StatusMessage error={error} />}

        {locked && <p className="text-xs text-text-faint">Esta es la cuenta de control: solo ella misma puede cambiar su nombre y su foto.</p>}

        <div className={`flex items-center gap-3 ${locked ? 'hidden' : ''}`}>
          <Button type="submit" variant="primary" disabled={!changed || !isValid || busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          {changed && !busy && <Button onClick={() => { setName(user.name); setEmail(user.email ?? ''); setError(null); }}>Descartar</Button>}
          {saved && !changed && <span role="status" className="text-sm text-text-muted">Cambios guardados.</span>}
        </div>
      </form>
    </section>
  );
}
