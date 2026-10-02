import { Schema, model } from 'mongoose';

const AnswerSchema = new Schema({
  question: { type: Schema.Types.ObjectId, required: true },
  answer:   { type: Boolean, required: true },
  deviation: { type: String, trim: true, maxlength: 500, default: null },
}, { _id: false });

const SectionScoreSchema = new Schema({
  section: { type: String, required: true },
  score:   { type: Number, required: true },
  max:     { type: Number, required: true },
}, { _id: false });

const AuditSchema = new Schema({
  questionnaire: { type: Schema.Types.ObjectId, ref: 'Questionnaire', required: true },
  auditor:       { type: Schema.Types.ObjectId, ref: 'User', default: null },   // user who made it; null in audits from before users existed
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

export default model('Audit', AuditSchema);