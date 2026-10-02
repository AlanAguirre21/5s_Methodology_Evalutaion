import mongoose from 'mongoose';
import User, { AVATAR_MAX_LENGTH, AVATAR_PATTERN, NAME_COLLATION, cleanName, toPublicUser } from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { ROLES } from '../constants/roles.js';

const DUPLICATE_NAME = 'Ya hay un usuario registrado con ese nombre';

function validName(value) {
  const name = cleanName(value);
  if (name.length < 3 || name.length > 100) throw new HttpError(400, 'El nombre debe tener de 3 a 100 caracteres');
  return name;
}

function validRole(role) {
  if (!Object.values(ROLES).includes(role)) throw new HttpError(400, 'Rol no válido');
  return role;
}

export async function list(req, res) {
  const users = await User.find({ active: true }).collation(NAME_COLLATION).sort({ name: 1 }).lean();
  res.json(users.map(toPublicUser));
}

export async function create(req, res) {
  const name = validName(req.body?.name);
  const role = validRole(req.body?.role ?? ROLES.USER);
  if (role !== ROLES.USER && req.user?.role !== ROLES.ADMIN) {
    throw new HttpError(403, 'Solo un administrador puede asignar ese rol');
  }

  try {
    const user = await User.create({ name, role });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
}

// avatar: a data URL, or null to remove the picture
export async function updateMe(req, res) {
  const { name, avatar } = req.body ?? {};
  const changes = {};

  if (name !== undefined) changes.name = validName(name);
  if (avatar !== undefined) {
    if (avatar !== null && (typeof avatar !== 'string' || avatar.length > AVATAR_MAX_LENGTH || !AVATAR_PATTERN.test(avatar))) {
      throw new HttpError(400, 'La imagen no es válida o es demasiado grande');
    }
    changes.avatar = avatar;
  }
  if (!Object.keys(changes).length) throw new HttpError(400, 'No hay cambios');

  try {
    const user = await User.findByIdAndUpdate(req.user._id, changes, { returnDocument: 'after', runValidators: true }).lean();
    res.json(toPublicUser(user));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
}

// An admin can change any role, including their own, but one admin must always remain
export async function updateRole(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  const role = validRole(req.body?.role);

  const user = await User.findOne({ _id: req.params.id, active: true });
  if (!user) throw new HttpError(404, 'Usuario no encontrado');

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const admins = await User.countDocuments({ role: ROLES.ADMIN, active: true });
    if (admins <= 1) throw new HttpError(409, 'Debe quedar al menos un administrador');
  }

  user.role = role;
  await user.save();
  res.json(toPublicUser(user));
}
