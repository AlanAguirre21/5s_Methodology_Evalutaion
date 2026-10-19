import Area, { AREA_COLLATION } from '../models/Area.js';
import defaultAreas from '../seed/default_areas.json' with { type: 'json' };

// Adds the default areas that are missing. Areas already registered (by key or by name) are left as the admins edited them.
export default async function ensureDefaultAreas() {
  const added = [];
  for (const area of defaultAreas) {
    const existing = await Area.findOne({ $or: [{ key: area.key }, { name: area.name }] }).collation(AREA_COLLATION);
    if (!existing) {
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
