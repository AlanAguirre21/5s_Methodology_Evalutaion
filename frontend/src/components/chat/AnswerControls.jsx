import { CheckCircle2, SendHorizontal, XCircle } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MenuOption from '../MenuOption.jsx';
import { RATING_OPTIONS } from '../../constants/ratings.js';

export const DEVIATION_MAX = 500;

export function RatingReplies({ onSelect, disabled }) {
  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised min-w-[220px] rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        {RATING_OPTIONS.map(({ points, label, color, icon: Icon }) => (
          <MenuOption key={points} icon={<Icon size={16} />} color={color} onClick={() => onSelect(points)} disabled={disabled}>
            {points} · {label}
          </MenuOption>
        ))}
      </div>
    </div>
  );
}

export function QuickReplies({ onYes, onNo, disabled }) {
  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised min-w-[180px] rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        <MenuOption icon={<CheckCircle2 size={16} />} color="success" onClick={onYes} disabled={disabled}>
          Sí
        </MenuOption>
        <MenuOption icon={<XCircle size={16} />} color="danger" onClick={onNo} disabled={disabled}>
          No
        </MenuOption>
      </div>
    </div>
  );
}

export function DeviationBar({ active, text, onTextChange, onSend, disabled, idlePlaceholder = 'Responde con Sí o No' }) {
  const canSend = active && !disabled && text.trim() !== '';

  function handleSubmit(e) {
    e.preventDefault();
    if (canSend) onSend();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/40 px-4 py-3.5">
      {active && <span aria-hidden="true" className="mb-1.5 block px-1 text-sm font-medium text-text-muted">¿Por qué?</span>}
      <div className="flex items-end gap-2">
        <label htmlFor="deviation" className="sr-only">Describe la desviación</label>
        <textarea
          id="deviation"
          rows={active ? 2 : 1}
          maxLength={DEVIATION_MAX}
          value={text}
          onChange={e => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!active || disabled}
          autoFocus={active}
          placeholder={active ? 'Describe la desviación…' : idlePlaceholder}
          className="neu-inset max-h-32 flex-1 resize-none rounded-2xl border border-white/50 bg-white/50 px-4 py-2
            text-sm text-text placeholder:text-text-faint transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30
            disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar desviación"
          className="neu-raised flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#409CFF]
            text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </form>
  );
}
