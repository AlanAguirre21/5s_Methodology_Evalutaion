import { CheckCircle2, CircleMinus, XCircle } from 'lucide-react';

export const RATING_OPTIONS = [
  { points: 2, label: 'Cumple', color: 'success', icon: CheckCircle2 },
  { points: 1, label: 'Cumple parcialmente', color: 'accent', icon: CircleMinus },
  { points: 0, label: 'No cumple', color: 'danger', icon: XCircle },
];

export const ratingOption = points => RATING_OPTIONS.find(o => o.points === points);
