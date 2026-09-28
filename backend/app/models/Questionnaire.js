import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
    text: { type: String, required: true, trim: true }
}); // Auto _id by default

const SectionSchema = new Schema({
    key: { type: String, required: true, trim: true, match: /^[a-z0-9_]+$/ },  // 5S order is enforced per questionnaire in seed.js
    name: { type: String, required: true, trim: true },
    weight: { type: Number, default: 1, min: 0 },
    questions: {type: [QuestionSchema], required: true},
}, {_id: false}); // Disable _id for subdocuments

const ResultSchema = new Schema({
    min: { type: Number, required: true, min: 0, max: 24},
    text: { type: String, required: true},
}, {_id: false}); // Disable _id for subdocuments

const QuestionnaireSchema = new Schema({
    key: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    sections: { type: [SectionSchema], required: true },
    results: { type: [ResultSchema], required: true },
}, { timestamps: true });

QuestionnaireSchema.index({ key: 1, version: 1 }, { unique: true }); // Unique index on key and version

export default model('Questionnaire', QuestionnaireSchema);