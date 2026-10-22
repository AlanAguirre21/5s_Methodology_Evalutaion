import { useEffect, useRef, useState } from 'react';

const HEIGHT = 240;
const MARGIN = { top: 20, right: 20, bottom: 28, left: 40 };
const Y_TICKS = [0, 25, 50, 75, 100];
const MAX_MARKERS = 60;   

const DAY = 24 * 60 * 60 * 1000;
const dayFormat   = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' });
const fullFormat  = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export default function ScoreChart({ points, from, to }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [hover, setHover] = useState(null);  

  const data = [...points].sort((a, b) => a.date - b.date);
  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const span = Math.max(1, to - from);

  const x = date => MARGIN.left + ((date - from) / span) * innerW;
  const y = pct => MARGIN.top + (1 - pct / 100) * innerH;

  const tickCount = Math.max(2, Math.min(6, Math.floor(innerW / 110)));
  const tickFormat = span > 60 * DAY ? monthFormat : dayFormat;
  const xTicks = Array.from({ length: tickCount }, (_, i) => new Date(from.getTime() + (span * i) / (tickCount - 1)));

  const path = data.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  const last = data.at(-1);
  const active = hover === null ? null : data[hover];

  function handleMove(e) {
    if (!data.length) return;
    const px = e.clientX - wrapRef.current.getBoundingClientRect().left;
    let nearest = 0;
    data.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(data[nearest].date) - px)) nearest = i;
    });
    setHover(nearest);
  }

  return (
    <div ref={wrapRef} className="relative" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Calificación de ${data.length} evaluaciones completadas en el periodo. Los valores están en la tabla de abajo.`}
          onPointerMove={handleMove}
          onPointerDown={handleMove}
          onPointerLeave={() => setHover(null)}
          className="block touch-pan-y"
        >
          {Y_TICKS.map(t => (
            <g key={t}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} className="stroke-border-strong" strokeWidth={t === 0 ? 1 : 0.5} />
              <text x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-text-faint text-[11px] tabular-nums">{t}</text>
            </g>
          ))}
          {xTicks.map((d, i) => (
            <text
              key={i}
              x={x(d)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? 'start' : i === tickCount - 1 ? 'end' : 'middle'}
              className="fill-text-faint text-[11px]"
            >
              {tickFormat.format(d)}
            </text>
          ))}

          {active && (
            <line x1={x(active.date)} x2={x(active.date)} y1={MARGIN.top} y2={MARGIN.top + innerH} className="stroke-text-faint" strokeWidth={1} />
          )}

          {data.length > 1 && (
            <path d={path} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {data.length <= MAX_MARKERS && data.map(p => (
            <circle key={p.id} cx={x(p.date)} cy={y(p.pct)} r={4} className="fill-accent stroke-white" strokeWidth={2} />
          ))}
          {active && <circle cx={x(active.date)} cy={y(active.pct)} r={6} className="fill-accent stroke-white" strokeWidth={2} />}

          {/* Direct label on the latest value only; every other value is in the hover and the table */}
          {last && !active && (
            <text
              x={x(last.date)}
              y={y(last.pct) + (last.pct > 88 ? 20 : -12)}
              textAnchor={x(last.date) > width - 60 ? 'end' : 'middle'}
              className="fill-text text-xs font-semibold tabular-nums"
            >
              {last.pct}
            </text>
          )}
        </svg>
      )}

      {active && (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 w-max max-w-56 rounded-control border border-white/70 bg-white/95 px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(x(active.date), 90), width - 90),
            top: Math.max(0, y(active.pct) - 12),
            transform: `translate(-50%, ${y(active.pct) < 90 ? '24px' : '-100%'})`,
          }}
        >
          <p className="text-sm font-semibold text-text tabular-nums">
            {active.pct} <span className="font-normal text-text-muted">/ 100</span>
          </p>
          <p className="text-text-muted">{active.score} de {active.total} puntos{active.result ? ` · ${active.result}` : ''}</p>
          <p className="text-text-faint">{fullFormat.format(active.date)}</p>
        </div>
      )}
    </div>
  );
}
