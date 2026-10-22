import User, { cleanEmail, toPublicUser } from '../models/User.js';
import HttpError from '../utils/HttpError.js';

export async function login(req, res) {
  const email = cleanEmail(req.body?.email);
  if (!email) throw new HttpError(400, 'El correo es obligatorio');

  const user = await User.findOne({ email }).lean();
  if (!user) throw new HttpError(404, 'Correo no registrado');

  res.json({ token: String(user._id), user: toPublicUser(user) });
}

export async function me(req, res) {
  res.json(toPublicUser(await User.findById(req.user._id).lean()));
}
