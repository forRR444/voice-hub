import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
};

const SIZE_MAP = {
  sm: "px-6 py-2.5 sm:px-10 sm:py-4 text-xs sm:text-lg",
  md: "px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base",
  lg: "px-6 py-3 sm:py-3.5 text-xs sm:text-base",
};

export default function CTAButton({ href, children, size = "md", block, className = "" }: Props) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold bg-[var(--brand)] text-white rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition";
  return (
    <Link
      href={href}
      className={`${base} ${SIZE_MAP[size]} ${block ? "block w-full text-center" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
