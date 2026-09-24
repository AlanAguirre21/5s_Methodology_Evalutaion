import Area from '../models/Area.js';
import HttpError from '../utils/HttpError.js';

export async function list(req, res) {
  res.json(await Area.find({ active: true }).select('name').sort({ name: 1 }).lean());
};

export async function create(req, res) {
  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'name is required');

  try {
    res.status(201).json(await Area.create({ name: name.trim() }));
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Area already exists');
    throw err;
  }
};