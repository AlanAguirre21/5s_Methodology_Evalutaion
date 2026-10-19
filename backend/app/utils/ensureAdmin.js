import User, { NAME_COLLATION, cleanEmail, cleanName } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

const LEGACY_EMAIL = 'admin@zf.com';

// The control user (isSystem) always exists as an active admin with the control email; its name is only changed by itself.
// It is found by the flag, or else by the control/legacy email or by ADMIN_NAME, so an existing "Admin 01" keeps its history.
// Returns its name if it had to be created or made admin again, or null.
export default async function ensureAdmin() {
  const name = cleanName(process.env.ADMIN_NAME) || 'Admin 01';
  const email = cleanEmail(process.env.ADMIN_EMAIL) || 'admin@zf.test';

  const control = await User.findOne({ isSystem: true })
    ?? await User.findOne({ email: { $in: [email, LEGACY_EMAIL] } })
    ?? await User.findOne({ name }).collation(NAME_COLLATION)
    ?? new User({ name });

  const restored = control.isNew || control.role !== ROLES.ADMIN || !control.active;
  control.set({ isSystem: true, email, role: ROLES.ADMIN, active: true });
  if (control.isModified() || control.isNew) await control.save();
  return restored ? control.name : null;
}
