import { Schema, model } from 'mongoose';

const SettingSchema = new Schema({
    key:   { type: String, required: true, unique: true },
    value: { type: String, required: true },
}, { timestamps: true });

export default model('Setting', SettingSchema);
