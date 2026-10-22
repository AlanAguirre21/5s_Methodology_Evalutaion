import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ['yes_no', 'rating', 'photo'] },   // empty: the questionnaire's answerType
});

const SectionSchema = new Schema({
    key: { type: String, required: true, trim: true, match: /^[a-z0-9_]+$/ },  
    name: { type: String, required: true, trim: true },
    weight: { type: Number, default: 1, min: 0 },
    questions: {type: [QuestionSchema], required: true},
}, {_id: false}); 

const ResultSchema = new Schema({
    min: { type: Number, required: true, min: 0, max: 29},
    text: { type: String, required: true},
}, {_id: false}); 

const QuestionnaireSchema = new Schema({
    key: { type: String, required: true, trim: true },
    version: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    answerType: { type: String, enum: ['yes_no', 'rating'], default: 'yes_no' },   // yes_no: 1 or 0 points | rating: 2, 1 or 0
    sections: { type: [SectionSchema], required: true },
    results: { type: [ResultSchema], required: true },
}, { timestamps: true });

QuestionnaireSchema.index({ key: 1, version: 1 }, { unique: true }); 
export default model('Questionnaire', QuestionnaireSchema);