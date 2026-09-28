const VARIANTS = {
  default: "neu-raised bg-white/60 text-text border border-white/50 hover:bg-white/80",
  primary: "bg-accent  text-white border-transparent hover:brightness-110 shadow-md shadow-accent/25",
  success: "bg-success text-white border-transparent hover:bg-success-hover shadow-md shadow-success/25",
  danger:  "bg-danger  text-white border-transparent hover:bg-danger-hover  shadow-md shadow-danger/25",
  warning: "bg-warning text-white border-transparent hover:bg-warning-hover shadow-md shadow-warning/25",
};

export default function Button({ variant = "default", className = "", ...props }) {
  return (
    <button
      className={`rounded-control px-4 py-2.5 font-medium text-sm transition-all active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}