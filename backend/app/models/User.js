import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 30, match: /^[a-z0-9._-]+$/ },
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    role:     { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    active:   { type: Boolean, default: true },
}, { timestamps: true });

// What the API returns for a user
export const toPublicUser = u => ({ id: String(u._id), username: u.username, name: u.name, role: u.role });

export default model('User', UserSchema);
