import { useState } from 'react';

const MAX = 500;

export default function AnswerControls({ onAnswer, disabled }) {
  const [mode, setMode] = useState('choose');   // 'choose' | 'deviation'
  const [text, setText] = useState('');

  if (mode === 'choose') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          disabled={disabled}
          className="rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => setMode('deviation')}
          disabled={disabled}
          className="rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          No
        </button>
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
        <button
          type="button"
          onClick={() => { setMode('choose'); setText(''); }}
          disabled={disabled}
          className="rounded-xl bg-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false, text.trim())}
          disabled={disabled || !text.trim()}
          className="rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}