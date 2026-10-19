import mongoose from 'mongoose';
import Area, { AREA_COLLATION, toPublicArea } from '../models/Area.js';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN, cleanEmail, cleanName } from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { ROLES } from '../constants/roles.js';
import { ensureManagerUser } from '../utils/ensureManagerUsers.js';

function validName(value) {
  const name = cleanName(value);
  if (name.length < 2 || name.length > 80) throw new HttpError(400, 'El nombre del área debe tener de 2 a 80 caracteres');
  return name;
}

function validCostCenter(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.trim().length > 100) throw new HttpError(400, 'El centro de coste no es válido');
  return value.trim();
}

function validManager(value) {
  const name = cleanName(value?.name);
  const email = cleanEmail(value?.email);
  if (name.length < 3 || name.length > 100) throw new HttpError(400, 'El nombre del responsable debe tener de 3 a 100 caracteres');
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) throw new HttpError(400, 'El correo del responsable no es válido');
  return { name, email };
}

async function nameTaken(name, exceptId) {
  return Area.exists({ name, ...(exceptId && { _id: { $ne: exceptId } }) }).collation(AREA_COLLATION);
}

const DUPLICATE = 'Ya hay un área registrada con ese nombre';

async function findArea(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid id');
  const area = await Area.findById(id);
  if (!area) throw new HttpError(404, 'Área no encontrada');
  return area;
}

// Active areas for the evaluation forms; ?all=true also returns the inactive ones (admins only)
export async function list(req, res) {
  const all = req.query.all === 'true' && req.user.role === ROLES.ADMIN;
  const areas = await Area.find(all ? {} : { active: true }).collation(AREA_COLLATION).sort({ name: 1 }).lean();
  res.json(areas.map(toPublicArea));
}

export async function create(req, res) {
  const name = validName(req.body?.name);
  const costCenter = validCostCenter(req.body?.costCenter);
  const manager = validManager(req.body?.manager);
  if (await nameTaken(name)) throw new HttpError(409, DUPLICATE);

  try {
    const area = await Area.create({ name, costCenter, manager });
    res.status(201).json({ ...toPublicArea(area), managerAccount: await ensureManagerUser(manager) });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE);
    throw err;
  }
}

export async function update(req, res) {
  const area = await findArea(req.params.id);
  const { name, costCenter, manager } = req.body ?? {};

  if (name !== undefined) area.name = validName(name);
  if (costCenter !== undefined) area.costCenter = validCostCenter(costCenter);
  if (manager !== undefined) area.manager = validManager(manager);
  if (name !== undefined && await nameTaken(area.name, area._id)) throw new HttpError(409, DUPLICATE);

  try {
    await area.save();
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE);
    throw err;
  }
  res.json({ ...toPublicArea(area), ...(manager !== undefined && { managerAccount: await ensureManagerUser(area.manager) }) });
}

// Areas are never deleted, so past evaluations keep pointing to them
export async function setActive(req, res) {
  if (typeof req.body?.active !== 'boolean') throw new HttpError(400, 'active must be true or false');
  const area = await findArea(req.params.id);
  area.active = req.body.active;
  await area.save();
  res.json(toPublicArea(area));
}
