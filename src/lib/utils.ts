import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number to MAD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
}

/**
 * Calculate stock status based on threshold
 */
export function getStockStatus(stock: number, lowStockThreshold: number = 10): 'critical' | 'low' | 'normal' {
  if (stock <= 0) return 'critical';
  if (stock <= lowStockThreshold) return 'low';
  return 'normal';
}

/**
 * Calculate total order amount
 */
export function calculateOrderTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}
