export default function StepCard({
  step,
  totalSteps = 2,
  header,
  children,
}: {
  step: number;
  totalSteps?: number;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      {header}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? "bg-indigo-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
