import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInventory } from './use-inventory';
import { supabase } from '@/infrastructure/api/supabase';

// Mock the Supabase client
vi.mock('@/infrastructure/api/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ 
          data: [
            { id: '1', name: 'Sucre Blanc', stock: 100, price: 45 },
            { id: '2', name: 'Sucre Roux', stock: 5, price: 55 }
          ], 
          error: null 
        }))
      }))
    }))
  }
}));

describe('useInventory Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products on mount', async () => {
    const { result } = renderHook(() => useInventory());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for the async effect
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(2);
    expect(result.current.products[0].name).toBe('Sucre Blanc');
    expect(result.current.error).toBeNull();
  });

  it('should handle errors correctly', async () => {
    // Override the mock for this specific test
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Database Connection Error' } 
        }))
      }))
    } as any);

    const { result } = renderHook(() => useInventory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database Connection Error');
    expect(result.current.products).toHaveLength(0);
  });
});
