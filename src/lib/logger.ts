const isDev = process.env.NODE_ENV !== "production";

export function logError(message: string, ...args: unknown[]) {
  console.error(message, ...args);
}

export function logWarn(message: string, ...args: unknown[]) {
  if (isDev) {
    console.warn(message, ...args);
  }
}
