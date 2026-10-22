import Area from '../models/Area.js';
import User from '../models/User.js';

// Areas and users are deleted now instead of deactivated: the ones deactivated before are deleted too.
// Returns the names of the deleted ones.
export default async function removeInactive() {
  const removed = {};
  for (const [label, model] of [['areas', Area], ['users', User]]) {
    const inactive = await model.collection.find({ active: false }).project({ name: 1 }).toArray();
    if (inactive.length) await model.collection.deleteMany({ _id: { $in: inactive.map(d => d._id) } });
    await model.collection.updateMany({ active: { $exists: true } }, { $unset: { active: '' } });
    removed[label] = inactive.map(d => d.name);
  }
  return removed;
}

export function logRemoved({ areas, users }) {
  if (areas.length) console.log(`Inactive areas deleted: ${areas.join(', ')}`);
  if (users.length) console.log(`Inactive users deleted: ${users.join(', ')}`);
}
