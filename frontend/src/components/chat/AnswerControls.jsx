import { useState } from 'react';
import Button from './Button.jsx';

const MAX = 500;

export default function AnswerControls({ onAnswer, disabled }) {
  const [mode, setMode] = useState('choose');   // 'choose' | 'deviation'
  const [text, setText] = useState('');

  if (mode === 'choose') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="success"
          onClick={() => onAnswer(true)}
          disabled={disabled}
        >
          Sí
        </Button>
        <Button
          variant="danger"
          onClick={() => setMode('deviation')}
          disabled={disabled}
        >
          No
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="deviation" className="block text-sm font-medium text-slate-700">
        Describe la desviación
      </label>
      <textarea
        id="deviation"
        autoFocus
        rows={3}
        maxLength={MAX}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
      />
      <p className="text-right text-xs text-slate-500">{text.length}/{MAX}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="default"
          onClick={() => { setMode('choose'); setText(''); }}
          disabled={disabled}
        >
          Cancelar
        </Button>
        <Button
          variant="warning"
          onClick={() => onAnswer(false, text.trim())}
          disabled={disabled || !text.trim()}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}