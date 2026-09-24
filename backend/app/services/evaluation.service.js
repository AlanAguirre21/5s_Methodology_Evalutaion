export function computeResult(questionnaire, answers) {
  const yes = new Set(
    answers.filter(a => a.answer).map(a => a.question.toString())
  );

  const sectionScores = questionnaire.sections.map(section => ({
    section: section.key,
    score: section.questions.filter(q => yes.has(q._id.toString())).length,
    max: section.questions.length,
  }));

  const score = sectionScores.reduce((sum, s) => sum + s.score, 0);

  const levels = [...questionnaire.results].sort((a, b) => b.min - a.min);
  const match = levels.find(r => score >= r.min);

  return { sectionScores, score, result: match ? match.text : null };
}