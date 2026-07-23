import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases condicionales (clsx) y resuelve conflictos de Tailwind
 * (tailwind-merge). Es el helper base de todos los componentes de UI.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
