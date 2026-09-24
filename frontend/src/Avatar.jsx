// Reemplaza EscalateIcon con el ícono SVG del bot de tu app

export default function Avatar({ size = 36 }) {
  return (
    <div
      className="neu-raised flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#5AC8FA] shrink-0 ring-1 ring-white/50"
      style={{ width: size, height: size }}
    >
      <YourBotIcon className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}