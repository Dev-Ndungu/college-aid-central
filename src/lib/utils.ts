
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to safely get environment variables with type checking
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[`VITE_${key}`] || defaultValue;
}

/**
 * Format a date string into a readable format
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not specified';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
