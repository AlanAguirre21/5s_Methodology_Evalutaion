import User, { NAME_COLLATION, cleanEmail, cleanName } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import defaultAreas from '../seed/default_areas.json' with { type: 'json' };

// An area manager always has a user (role "user"), so they see the evaluations of their area in their history.
// Returns { status: 'exists' | 'created' | 'linked' | 'skipped', name, takenBy? }
export async function ensureManagerUser(manager) {
  const name = cleanName(manager.name);
  const email = cleanEmail(manager.email);
  if (await User.exists({ email })) return { status: 'exists', name };

  const sameName = await User.findOne({ name }).collation(NAME_COLLATION);
  if (!sameName) {
    await User.create({ name, email, role: ROLES.USER });
    return { status: 'created', name };
  }
  if (!sameName.email) {
    sameName.email = email;
    await sameName.save();
    return { status: 'linked', name };
  }
  return { status: 'skipped', name, takenBy: sameName.email };
}

export default async function ensureManagerUsers() {
  const results = [];
  for (const { manager } of defaultAreas) results.push(await ensureManagerUser(manager));
  return results;
}

export function logManagerUsers(results) {
  const names = status => results.filter(r => r.status === status);
  const created = names('created'), linked = names('linked'), skipped = names('skipped');
  if (created.length) console.log(`Manager users created: ${created.map(r => r.name).join(', ')}`);
  if (linked.length) console.log(`Manager email added to existing users: ${linked.map(r => r.name).join(', ')}`);
  if (skipped.length) console.warn(`Manager users not created: ${skipped.map(r => `${r.name} (el nombre ya lo usa ${r.takenBy})`).join(', ')}`);
}
