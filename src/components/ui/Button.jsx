const variants = {
  primary: "bg-lince-900 text-white hover:bg-lince-800 active:bg-lince-950 disabled:bg-lince-900/40",
  accent: "bg-arena-500 text-lince-950 hover:bg-arena-400 active:bg-arena-600 disabled:bg-arena-500/40",
  outline: "border border-lince-900/20 bg-white text-lince-900 hover:bg-lince-50 disabled:opacity-50",
  ghost: "text-lince-900 hover:bg-lince-900/5 disabled:opacity-50",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:opacity-50",
  success: "bg-lince-600 text-white hover:bg-lince-700 disabled:opacity-50",
};
const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
  icon: "h-10 w-10",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
