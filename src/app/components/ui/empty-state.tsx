type EmptyStateProps = {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  children?: React.ReactNode;
  card?: boolean;
};

export default function EmptyState({
  icon,
  message,
  description,
  children,
  card = false,
}: EmptyStateProps) {
  const wrapperClass = card
    ? "bg-white rounded-lg border border-foreground/10 shadow-sm text-center py-16"
    : "text-center py-16 text-foreground/50";

  return (
    <div className={wrapperClass}>
      {icon && <div className="mx-auto text-foreground/20 mb-3">{icon}</div>}
      <p className="text-sm text-foreground/50">{message}</p>
      {description && <p className="text-xs text-foreground/30 mt-1">{description}</p>}
      {children}
    </div>
  );
}
