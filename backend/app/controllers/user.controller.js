import User, { toPublicUser } from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { ROLES } from '../constants/roles.js';

const USERNAME = /^[a-z0-9._-]{3,30}$/;

// Open to anyone, but only an admin can create a user with a role other than "user".
export async function create(req, res) {
  const { username, name, role = ROLES.USER } = req.body ?? {};

  if (typeof username !== 'string' || !USERNAME.test(username.trim().toLowerCase())) {
    throw new HttpError(400, 'El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo');
  }
  if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'El nombre es obligatorio');
  if (name.trim().length > 100) throw new HttpError(400, 'El nombre no puede tener más de 100 caracteres');
  if (!Object.values(ROLES).includes(role)) throw new HttpError(400, 'Rol no válido');
  if (role !== ROLES.USER && req.user?.role !== ROLES.ADMIN) {
    throw new HttpError(403, 'Solo un administrador puede asignar ese rol');
  }

  try {
    const user = await User.create({ username: username.trim().toLowerCase(), name: name.trim(), role });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Ese usuario ya está registrado');
    throw err;
  }
}
