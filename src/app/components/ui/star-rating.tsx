import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number;
  size?: number;
  filledClass?: string;
  emptyClass?: string;
  /** Override filled color with hex value (for theme-token usage) */
  filledColor?: string;
  /** Override empty color with hex value (for theme-token usage) */
  emptyColor?: string;
  gap?: string;
  className?: string;
  /** Use <span> instead of <div> as root element */
  inline?: boolean;
};

export default function StarRating({
  rating,
  size = 14,
  filledClass = "text-amber-400",
  emptyClass = "text-foreground/20",
  filledColor,
  emptyColor,
  gap = "gap-0.5",
  className = "",
  inline = false,
}: StarRatingProps) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={`flex items-center ${gap} ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? (filledColor ?? "currentColor") : "none"}
            className={!filledColor ? (filled ? filledClass : emptyClass) : undefined}
            style={filledColor ? { color: filled ? filledColor : emptyColor } : undefined}
          />
        );
      })}
    </Tag>
  );
}
