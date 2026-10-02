import User, { NAME_COLLATION, cleanName, toPublicUser } from '../models/User.js';
import HttpError from '../utils/HttpError.js';

export async function login(req, res) {
  const name = cleanName(req.body?.name);
  if (!name) throw new HttpError(400, 'El nombre es obligatorio');

  const user = await User.findOne({ name, active: true }).collation(NAME_COLLATION).lean();
  if (!user) throw new HttpError(404, 'Usuario no registrado');

  res.json({ token: String(user._id), user: toPublicUser(user) });
}

export async function me(req, res) {
  res.json(toPublicUser(await User.findById(req.user._id).lean()));
}
