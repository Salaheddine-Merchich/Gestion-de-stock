import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, getStockStatus, calculateOrderTotal } from './utils';

describe('Utility Functions', () => {
  
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
      expect(cn('bg-red-500', { 'p-4': true, 'm-2': false })).toBe('bg-red-500 p-4');
    });
  });

  describe('formatCurrency', () => {
    it('should format amount as MAD currency', () => {
      // Note: Intl formatting might vary slightly by environment (spaces vs non-breaking spaces)
      // We check if it contains the essential parts
      const result = formatCurrency(1500);
      expect(result).toContain('1');
      expect(result).toContain('500');
      expect(result).toContain('MAD');
    });
  });

  describe('getStockStatus', () => {
    it('should return critical when stock is 0 or less', () => {
      expect(getStockStatus(0)).toBe('critical');
      expect(getStockStatus(-5)).toBe('critical');
    });

    it('should return low when stock is below threshold', () => {
      expect(getStockStatus(5, 10)).toBe('low');
      expect(getStockStatus(10, 10)).toBe('low');
    });

    it('should return normal when stock is above threshold', () => {
      expect(getStockStatus(20, 10)).toBe('normal');
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total for multiple items', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 50, quantity: 1 },
        { price: 100, quantity: 3 }
      ];
      expect(calculateOrderTotal(items)).toBe(370);
    });

    it('should return 0 for empty list', () => {
      expect(calculateOrderTotal([])).toBe(0);
    });
  });

});
