const isDev = process.env.NODE_ENV !== "production";

export function logError(message: string, ...args: unknown[]) {
  if (isDev) {
    console.error(message, ...args);
  }
  // In production, you could send to an error tracking service like Sentry
}
