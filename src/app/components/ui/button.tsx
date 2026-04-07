"use client";

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "text-foreground/70 border border-foreground/10 hover:bg-foreground/5",
  danger: "text-red-500 border border-foreground/10 hover:bg-foreground/5",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-lg cursor-pointer disabled:opacity-50 transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
