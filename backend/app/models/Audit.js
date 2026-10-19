import { Schema, model } from 'mongoose';
import { AVATAR_PATTERN } from './User.js';

// Photo answers are stored inline as a data URL (the frontend resizes it before uploading)
export const PHOTO_MAX_LENGTH = 1_500_000;
export const PHOTO_PATTERN = AVATAR_PATTERN;

const AnswerSchema = new Schema({
  question: { type: Schema.Types.ObjectId, required: true },
  answer:   { type: Boolean, default: null },   // yes_no questions
  points:   { type: Number, min: 0, max: 2, default: null },   // rating questions
  deviation: { type: String, trim: true, maxlength: 500, default: null },
  photo:    { type: String, default: null, maxlength: PHOTO_MAX_LENGTH, match: PHOTO_PATTERN },
}, { _id: false });

const SectionScoreSchema = new Schema({
  section: { type: String, required: true },
  score:   { type: Number, required: true },
  max:     { type: Number, required: true },
}, { _id: false });

const AuditSchema = new Schema({
  questionnaire: { type: Schema.Types.ObjectId, ref: 'Questionnaire', required: true },
  auditor:       { type: Schema.Types.ObjectId, ref: 'User', default: null },   // user who made it; null in audits from before users existed
  evaluated:     { type: Schema.Types.ObjectId, ref: 'User', default: null },   // user evaluated; null in audits from before it was a user
  costCenter:    { type: String, trim: true, maxlength: 100 },     
  area:          { type: String, trim: true, maxlength: 100 },    
  supervisor:    { type: String, trim: true, maxlength: 100 },     
  evaluatedPerson: { type: String, trim: true, maxlength: 100 },   
  department:    { type: String, trim: true, maxlength: 100 },     
  workshop:      { type: String, trim: true, maxlength: 100 },     
  answers:       { type: [AnswerSchema], default: [] },
  status:        { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  sectionScores: { type: [SectionScoreSchema], default: [] },
  score:         { type: Number, default: null },
  result:        { type: String, default: null },
  completedAt:   { type: Date, default: null },
}, { timestamps: true });

AuditSchema.index({ area: 1, completedAt: -1 });
AuditSchema.index({ auditor: 1, createdAt: -1 });
AuditSchema.index({ evaluated: 1, createdAt: -1 });

export default model('Audit', AuditSchema);