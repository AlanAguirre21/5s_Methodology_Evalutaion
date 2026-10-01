import User, { toPublicUser } from '../models/User.js';
import HttpError from '../utils/HttpError.js';

export async function login(req, res) {
  const { username } = req.body ?? {};
  if (typeof username !== 'string' || !username.trim()) throw new HttpError(400, 'El usuario es obligatorio');

  const user = await User.findOne({ username: username.trim().toLowerCase(), active: true }).lean();
  if (!user) throw new HttpError(404, 'Usuario no registrado');

  res.json({ token: String(user._id), user: toPublicUser(user) });
}

export function me(req, res) {
  res.json(toPublicUser(req.user));
}
