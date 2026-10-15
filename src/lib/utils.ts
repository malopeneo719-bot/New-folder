import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convex wraps server errors with request ids and stack traces — pull out the
 * human-readable sentence so people see "That code is incorrect" instead of a
 * wall of diagnostics.
 */
export function readableError(err: unknown, fallback: string) {
  const raw = err instanceof Error ? err.message : "";
  const match =
    raw.match(/Uncaught Error:\s*([^\n]+)/) ??
    raw.match(/(?:ConvexError|Error):\s*([^\n]+)/);
  const message = (match ? match[1] : raw).split("\n")[0].trim();
  return message && message.length <= 180 ? message : fallback;
}
