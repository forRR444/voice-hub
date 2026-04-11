import type { LucideIcon } from "lucide-react";

const SIZES = {
  xs: { container: "w-5 h-5 sm:w-10 sm:h-10", sm: 14, lg: 20 },
  sm: { container: "w-8 h-8 sm:w-10 sm:h-10", sm: 16, lg: 20 },
  md: { container: "w-14 h-14 sm:w-18 sm:h-18", sm: 22, lg: 28 },
} as const;

type Props = {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  className?: string;
};

export default function IconCircle({ icon: Icon, size = "sm", className = "" }: Props) {
  const s = SIZES[size];
  return (
    <div className={`bg-indigo-50 rounded-full flex items-center justify-center ${s.container} ${className}`}>
      <Icon size={s.sm} className="text-[var(--brand)] sm:hidden" />
      <Icon size={s.lg} className="text-[var(--brand)] hidden sm:block" />
    </div>
  );
}
