import Questionnaire from '../models/Questionnaire.js';

export async function list(req, res) {
    const items = await Questionnaire.aggregate([
        { $sort: { key: 1, version: -1} },
        { $group: { _id: '$key', title: { $first: '$tilte' } } },
        { $project: { _id: 0, key: '$_id', title: 1 } },
        { $sort: { title: 1 } },
    ]);
    res.json(items);
}