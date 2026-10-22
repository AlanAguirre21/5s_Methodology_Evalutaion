import Area, { AREA_COLLATION } from '../models/Area.js';
import Audit from '../models/Audit.js';
import defaultAreas from '../seed/default_areas.json' with { type: 'json' };

// Adds the default areas on a new install (no areas and no evaluations), so the ones the admins delete aren't added again.
// Areas already registered (by key or by name) are left as the admins edited them.
export default async function ensureDefaultAreas() {
  const added = [];
  const firstRun = !(await Area.exists({})) && !(await Audit.exists({}));
  for (const area of defaultAreas) {
    const existing = await Area.findOne({ $or: [{ key: area.key }, { name: area.name }] }).collation(AREA_COLLATION);
    if (!existing) {
      if (!firstRun) continue;
      await Area.create(area);
      added.push(area.name);
    } else if (!existing.key) {
      existing.key = area.key;
      existing.manager ??= area.manager;
      await existing.save();
    }
  }
  return added;
}
