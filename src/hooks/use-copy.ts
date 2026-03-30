import { useState, useRef } from "react";

export function useCopy(timeout = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copy(text: string, key = "default") {
    navigator.clipboard.writeText(text);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setCopiedKey(key);
    timerRef.current = setTimeout(() => {
      setCopiedKey(null);
      timerRef.current = null;
    }, timeout);
  }

  return { copiedKey, copy };
}
