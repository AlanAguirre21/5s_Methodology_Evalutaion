import mongoose from 'mongoose';
import User, {
  AVATAR_MAX_LENGTH, AVATAR_PATTERN, EMAIL_MAX_LENGTH, EMAIL_PATTERN, NAME_COLLATION, cleanEmail, cleanName, toPublicUser,
} from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { ROLES } from '../constants/roles.js';

const duplicateMessage = err => (err.keyPattern?.email
  ? 'Ya hay un usuario registrado con ese correo'
  : 'Ya hay un usuario registrado con ese nombre');

function validName(value) {
  const name = cleanName(value);
  if (name.length < 3 || name.length > 100) throw new HttpError(400, 'El nombre debe tener de 3 a 100 caracteres');
  return name;
}

function validEmail(value) {
  const email = cleanEmail(value);
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) throw new HttpError(400, 'El correo no es válido');
  return email;
}

function validRole(role) {
  if (!Object.values(ROLES).includes(role)) throw new HttpError(400, 'Rol no válido');
  return role;
}

// ?all=true also returns the deactivated users
export async function list(req, res) {
  const users = await User.find(req.query.all === 'true' ? {} : { active: true }).collation(NAME_COLLATION).sort({ name: 1 }).lean();
  res.json(users.map(toPublicUser));
}

export async function create(req, res) {
  if (req.user && req.user.role !== ROLES.ADMIN) throw new HttpError(403, 'Solo un administrador puede crear usuarios');
  const name = validName(req.body?.name);
  const email = validEmail(req.body?.email);
  const role = validRole(req.body?.role ?? ROLES.USER);
  if (role !== ROLES.USER && req.user?.role !== ROLES.ADMIN) {
    throw new HttpError(403, 'Solo un administrador puede asignar ese rol');
  }

  try {
    const user = await User.create({ name, email, role });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, duplicateMessage(err));
    throw err;
  }
}

// avatar: a data URL, or null to remove the picture
async function updateProfile(id, body, res, editor) {
  const { name, email, avatar } = body ?? {};
  const changes = {};

  const target = await User.findOne({ _id: id, active: true }).select('isSystem email').lean();
  if (!target) throw new HttpError(404, 'Usuario no encontrado');
  if (target.isSystem) {
    if (String(editor._id) !== String(target._id)) throw new HttpError(403, 'Solo la cuenta de control puede editarse a sí misma');
    if (email !== undefined && cleanEmail(email) !== target.email) throw new HttpError(403, 'El correo de la cuenta de control no se puede cambiar');
  }

  if (name !== undefined) changes.name = validName(name);
  if (email !== undefined) changes.email = validEmail(email);
  if (avatar !== undefined) {
    if (avatar !== null && (typeof avatar !== 'string' || avatar.length > AVATAR_MAX_LENGTH || !AVATAR_PATTERN.test(avatar))) {
      throw new HttpError(400, 'La imagen no es válida o es demasiado grande');
    }
    changes.avatar = avatar;
  }
  if (!Object.keys(changes).length) throw new HttpError(400, 'No hay cambios');

  try {
    const user = await User.findOneAndUpdate({ _id: id, active: true }, changes, { returnDocument: 'after', runValidators: true }).lean();
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    res.json(toPublicUser(user));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, duplicateMessage(err));
    throw err;
  }
}

export async function updateMe(req, res) {
  await updateProfile(req.user._id, req.body, res, req.user);
}

export async function update(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  await updateProfile(req.params.id, req.body, res, req.user);
}

// Users are never deleted, so their evaluations keep pointing to them. A deactivated user can't log in.
export async function setActive(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  if (typeof req.body?.active !== 'boolean') throw new HttpError(400, 'active must be true or false');
  const { active } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');

  if (!active) {
    if (user.isSystem) throw new HttpError(403, 'La cuenta de control no se puede desactivar');
    if (user._id.equals(req.user._id)) throw new HttpError(409, 'No puedes desactivar tu propio usuario');
    if (user.role === ROLES.ADMIN && user.active) {
      const admins = await User.countDocuments({ role: ROLES.ADMIN, active: true });
      if (admins <= 1) throw new HttpError(409, 'Debe quedar al menos un administrador');
    }
  }

  user.active = active;
  await user.save();
  res.json(toPublicUser(user));
}

// An admin can change any role, including their own, but one admin must always remain
export async function updateRole(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  const role = validRole(req.body?.role);

  const user = await User.findOne({ _id: req.params.id, active: true });
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  if (user.isSystem) throw new HttpError(403, 'La cuenta de control siempre es administrador');

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const admins = await User.countDocuments({ role: ROLES.ADMIN, active: true });
    if (admins <= 1) throw new HttpError(409, 'Debe quedar al menos un administrador');
  }

  user.role = role;
  await user.save();
  res.json(toPublicUser(user));
}
