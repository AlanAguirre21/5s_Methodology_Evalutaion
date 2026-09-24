import { Schema, model } from 'mongoose';

const AreaSchema = new Schema({
    name: {type: String, required: true, unique: true, trim: true, maxlength: 80},
    active: {type: Boolean, default: true},
}, {timestamps: true});

export default model('Area', AreaSchema);