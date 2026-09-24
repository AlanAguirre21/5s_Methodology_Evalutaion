export function Input(props) {
  return (
    <input {...props}
      className={`neu-inset w-full bg-white/60 border border-white/50 rounded-control px-3 py-1.5
        text-sm text-text placeholder:text-text-faint
        focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-shadow
        ${props.className || ""}`}
    />
  );
}

export function Label({ children }) {
  return <label className="block text-xs font-medium text-text-muted mb-1">{children}</label>;
}