import mongoose from 'mongoose';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';

// Identification, not authentication: the bearer token is just the user's id (no passwords, no signature).
export async function identify(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme === 'Bearer' && mongoose.isValidObjectId(token)) {
    req.user = await User.findById(token).select('-avatar').lean();   // the picture is only loaded where it's returned
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) throw new HttpError(401, 'Sesión no válida. Inicia sesión de nuevo.');
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw new HttpError(401, 'Sesión no válida. Inicia sesión de nuevo.');
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'No tienes permiso para esta acción');
    next();
  };
}
