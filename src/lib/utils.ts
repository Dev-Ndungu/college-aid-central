
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks sensitive information by showing only parts of it
 * @param value The string to mask
 * @param showFirst Number of characters to show at the beginning
 * @param showLast Number of characters to show at the end
 * @returns Masked string
 */
export function maskSensitiveInfo(
  value: string | null | undefined, 
  showFirst = 2, 
  showLast = 2
): string {
  if (!value) return "Not provided";
  if (value.length <= showFirst + showLast) return value;
  
  const firstPart = value.substring(0, showFirst);
  const lastPart = value.substring(value.length - showLast);
  const middlePart = '*'.repeat(Math.min(5, value.length - (showFirst + showLast)));
  
  return `${firstPart}${middlePart}${lastPart}`;
}
