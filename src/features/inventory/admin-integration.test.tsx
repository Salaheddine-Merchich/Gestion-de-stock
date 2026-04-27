import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminProducts from '../admin/pages/Products';
import { supabase } from '@/infrastructure/api/supabase';
import { toast } from 'sonner';
import React from 'react';

/**
 * TEST D'INTÉGRATION : Gestion Admin des Stocks
 * -------------------------------------------
 * Ce test valide l'interaction entre le dashboard Admin et Supabase.
 */

// Mock de Sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@/infrastructure/api/supabase', () => {
  const mockFrom = vi.fn().mockImplementation((table) => {
    return {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => {
        if (table === 'products') {
          return Promise.resolve({
            data: [
              { 
                id: 'p1', 
                name: 'Sucre Granulé 50kg', 
                price: 50.00, 
                stock: 10,
                description: 'Sucre de qualité supérieure',
                category: { name: 'Sucre' },
                created_at: new Date().toISOString()
              }
            ],
            error: null
          });
        }
        if (table === 'categories') {
          return Promise.resolve({
            data: [{ id: 'c1', name: 'Sucre' }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return {
    supabase: {
      from: mockFrom,
    }
  };
});

describe('Integration Test: Admin Product Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load products and allow updating stock', async () => {
    render(<AdminProducts />, { wrapper: BrowserRouter });

    // 1. Vérifier le chargement initial
    const productName = await screen.findByText('Sucre Granulé 50kg');
    expect(productName).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();

    // 2. Cliquer sur Modifier
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // 3. Vérifier que le dialogue est ouvert avec les bonnes données
    const stockInput = await screen.findByLabelText(/Stock/i);
    expect(stockInput).toHaveValue(10);

    // 4. Changer le stock à 25
    fireEvent.change(stockInput, { target: { value: '25' } });

    // 5. Soumettre
    const submitButton = screen.getByText('Modifier', { selector: 'button[type="submit"]' });
    fireEvent.click(submitButton);

    // 6. Vérifier l'appel API et le toast de succès
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(toast.success).toHaveBeenCalledWith('Produit modifié avec succès');
    });
  });
});
