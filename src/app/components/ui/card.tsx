"use client";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: string;
};

export default function Card({
  padding = "p-4 sm:p-6",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-foreground/10 shadow-sm ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
