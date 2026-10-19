export const RATING_MAX = 2;

export const questionType = (questionnaire, question) => question.type ?? questionnaire.answerType ?? 'yes_no';

export function maxPoints(type) {
  if (type === 'photo') return 0;
  return type === 'rating' ? RATING_MAX : 1;
}

export const pointsOf = answer => answer.points ?? (answer.answer ? 1 : 0);

export function computeResult(questionnaire, answers) {
  const byQuestion = new Map(answers.map(a => [a.question.toString(), a]));

  const sectionScores = questionnaire.sections.flatMap(section => {
    const scored = section.questions.filter(q => maxPoints(questionType(questionnaire, q)) > 0);
    if (!scored.length) return [];
    return [{
      section: section.key,
      score: scored.reduce((sum, q) => sum + (byQuestion.has(q._id.toString()) ? pointsOf(byQuestion.get(q._id.toString())) : 0), 0),
      max: scored.reduce((sum, q) => sum + maxPoints(questionType(questionnaire, q)), 0),
    }];
  });

  const score = sectionScores.reduce((sum, s) => sum + s.score, 0);

  const levels = [...questionnaire.results].sort((a, b) => b.min - a.min);
  const match = levels.find(r => score >= r.min);

  return { sectionScores, score, result: match ? match.text : null };
}
