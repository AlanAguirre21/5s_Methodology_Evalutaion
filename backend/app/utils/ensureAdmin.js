import User, { NAME_COLLATION, cleanName } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

// The system always needs one admin. Returns the name of the admin it had to create or promote, or null.
export default async function ensureAdmin() {
  if (await User.exists({ role: ROLES.ADMIN, active: true })) return null;

  const name = cleanName(process.env.ADMIN_NAME) || 'Admin 01';
  await User.updateOne(
    { name },
    { $set: { role: ROLES.ADMIN, active: true } },
    { upsert: true, collation: NAME_COLLATION },
  );
  return name;
}
