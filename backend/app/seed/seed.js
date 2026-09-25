import 'dotenv/config';
import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import Area from '../models/Area.js';
import floor from './floor.json' with{ type: 'json' };
//import data from './office.json' with{ type: 'json' };

const QUESTIONNAIRES = [piso, oficina];
const AREAS = ['Almacén', 'Producción', 'Mantenimiento'];  
const REQUIRED = ['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'];

function validate(q) {
  const keys = q.sections.map(s => s.key);
  if (keys.length !== 5 || !REQUIRED.every((k, i) => keys[i] === k)) {
    throw new Error(`Sections must be exactly, in order: ${REQUIRED.join(', ')}`);
  }
  for (const s of q.sections) {
    if (!s.questions?.length) throw new Error(`Section "${s.key}" has no questions`);
  }
  if (!q.results.some(r => r.min === 0)) {
    throw new Error('Results need a level with min 0, or low scores get no result');
  }
}

for (const data of QUESTIONNAIRES) {
  validate(data);
  try {
  validate(data);
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await Questionnaire.exists({ key: data.key, version: data.version });
  if (exists) {
    console.log(`"${data.key}" v${data.version} already exists. To change questions, increment "version".`);
  } else {
    await Questionnaire.create(data);
    console.log(`"${data.key}" v${data.version} created`);
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
}
