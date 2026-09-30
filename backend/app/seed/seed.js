import 'dotenv/config';
import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Area from '../models/Area.js';
import floor from './floor.json' with { type: 'json' };
import office from './office.json' with { type: 'json' };

const QUESTIONNAIRES = [floor, office];
const AREAS = ['Almacén', 'Producción', 'Mantenimiento'];
const FIVE_S = ['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'];
const FIVE_S_KEYS = ['piso']; 

function validate(q) {
  const keys = q.sections.map(s => s.key);
  if (!keys.length) throw new Error(`"${q.key}": needs at least one section`);
  if (new Set(keys).size !== keys.length) throw new Error(`"${q.key}": section keys must be unique`);

  if (FIVE_S_KEYS.includes(q.key) &&
      (keys.length !== 5 || !FIVE_S.every((k, i) => keys[i] === k))) {
    throw new Error(`"${q.key}": sections must be exactly, in order: ${FIVE_S.join(', ')}`);
  }
  for (const s of q.sections) {
    if (!s.questions?.length) throw new Error(`"${q.key}": section "${s.key}" has no questions`);
  }
  if (!q.results.some(r => r.min === 0)) {
    throw new Error(`"${q.key}": results need a level with min 0, or low scores get no result`);
  }
}

try {
  QUESTIONNAIRES.forEach(validate);   
  await mongoose.connect(process.env.MONGO_URI);

  for (const data of QUESTIONNAIRES) {
    const exists = await Questionnaire.exists({ key: data.key, version: data.version });
    if (exists) {
      console.log(`"${data.key}" v${data.version} already exists. To change questions, increment "version".`);
    } else {
      await Questionnaire.create(data);
      console.log(`"${data.key}" v${data.version} created`);
    }
  }

  for (const name of AREAS) {
    await Area.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  console.log(`Areas ensured: ${AREAS.join(', ')}`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
