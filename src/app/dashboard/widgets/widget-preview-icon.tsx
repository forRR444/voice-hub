/**
 * ウィジェットタイプのプレビューアイコン
 */
export function WidgetPreviewIcon({ type, selected }: { type: string; selected: boolean }) {
  const bg = selected ? "bg-indigo-100" : "bg-foreground/5";
  const bar = selected ? "bg-indigo-300" : "bg-foreground/20";
  const block = selected ? "bg-indigo-200" : "bg-foreground/10";

  switch (type) {
    case "carousel":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center gap-1 px-2`}>
          <div className={`w-1 h-8 ${bar} rounded-sm shrink-0`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-1 h-8 ${bar} rounded-sm shrink-0`} />
        </div>
      );
    case "grid":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2`}>
          <div className="grid grid-cols-3 gap-1 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${block} rounded-sm`} />
            ))}
          </div>
        </div>
      );
    case "marquee":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center gap-1 px-2 overflow-hidden`}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-12 h-10 ${block} rounded shrink-0`} />
          ))}
        </div>
      );
    case "wall":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2`}>
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className={`${block} rounded-sm row-span-2`} />
            <div className={`${block} rounded-sm`} />
            <div className={`${block} rounded-sm row-span-2`} />
            <div className={`${block} rounded-sm`} />
          </div>
        </div>
      );
    case "list":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2 flex flex-col gap-1`}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-full flex-1 ${block} rounded-sm border-l-2 ${selected ? "border-indigo-400" : "border-foreground/30"}`} />
          ))}
        </div>
      );
    case "single":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center p-2`}>
          <div className={`w-20 h-12 ${block} rounded`} />
        </div>
      );
    case "badge":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center`}>
          <div className={`${block} rounded-full px-4 py-2 flex items-center gap-2`}>
            <div className={`w-5 h-5 ${bar} rounded-sm`} />
            <div className={`w-12 h-2 ${bar} rounded`} />
          </div>
        </div>
      );
    default:
      return null;
  }
}
