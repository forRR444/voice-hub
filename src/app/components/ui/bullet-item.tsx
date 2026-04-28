import { Circle } from "lucide-react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function BulletItem({ children, className = "" }: Props) {
  return (
    <li className={`flex items-center gap-2 ${className}`}>
      <Circle size={5} className="text-[var(--brand)] shrink-0 fill-[var(--brand)] sm:hidden" />
      <Circle
        size={6}
        className="text-[var(--brand)] shrink-0 fill-[var(--brand)] hidden sm:block"
      />
      {children}
    </li>
  );
}
