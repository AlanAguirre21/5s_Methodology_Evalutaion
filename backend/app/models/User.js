import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

export const NAME_COLLATION = { locale: 'es', strength: 1 };

// The picture is stored inline as a small data URL (the frontend resizes it before uploading)
export const AVATAR_MAX_LENGTH = 90_000;
export const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new Schema({
    name:   { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    email:  { type: String, trim: true, lowercase: true, maxlength: EMAIL_MAX_LENGTH, match: EMAIL_PATTERN },   // used to log in; missing in users from before it existed
    role:   { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    avatar: { type: String, default: null, maxlength: AVATAR_MAX_LENGTH, match: AVATAR_PATTERN },
    isSystem: { type: Boolean, default: false },   // the control user (Admin 01): always an admin, its email never changes, only it can edit itself
}, { timestamps: true });

UserSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

export const cleanName = name => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');
export const cleanEmail = email => (typeof email === 'string' ? email.trim().toLowerCase() : '');

export const toPublicUser = u => ({
  id: String(u._id),
  name: u.name,
  email: u.email ?? null,
  role: u.role,
  avatar: u.avatar ?? null,
  isSystem: Boolean(u.isSystem),
  createdAt: u.createdAt,
});

export default model('User', UserSchema);
