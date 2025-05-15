
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets an environment variable safely
 * @param key The environment variable key
 * @returns The environment variable value or empty string
 */
export function getEnv(key: string): string {
  return import.meta.env[key] || '';
}

