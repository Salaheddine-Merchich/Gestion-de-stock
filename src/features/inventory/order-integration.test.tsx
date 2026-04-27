import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from '@/application/contexts/CartContext';
import { AuthProvider } from '@/application/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import ClientCart from '../client/pages/Cart';
import { supabase } from '@/infrastructure/api/supabase';
import { toast } from 'sonner';
import React from 'react';

/**
 * TEST D'INTÉGRATION INTERNE : Flux de Commande (Version Production)
 * -------------------------------------------
 */

// Mock de Sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase Robuste
vi.mock('@/infrastructure/api/supabase', () => {
  const mockQuery = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: { id: 'mock-id' }, error: null })),
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn().mockResolvedValue({ 
          data: { session: { user: { id: 'user-123' } } } 
        }),
      },
    }
  };
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Integration Test: Order Management Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    
    const mockCart = [
      {
        product: { 
          id: 'p1', 
          name: 'Sucre Granulé 50kg', 
          price: 50.00, 
          stock: 10,
          category: { name: 'Sucre' }
        },
        quantity: 2
      }
    ];
    window.localStorage.setItem('cart', JSON.stringify(mockCart));
  });

  it('should process the full order flow from UI to Infrastructure', async () => {
    render(<ClientCart />, { wrapper: AllProviders });

    // 1. Attendre le chargement initial
    const productName = await screen.findByText('Sucre Granulé 50kg');
    expect(productName).toBeInTheDocument();
    
    // Vérifier le prix (présent dans l'item et le total)
    const priceElements = screen.getAllByText('100.00 €');
    expect(priceElements.length).toBeGreaterThanOrEqual(1);

    // 2. Simulation de dépassement de stock
    const input = screen.getByDisplayValue('2');
    fireEvent.change(input, { target: { value: '11' } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Stock insuffisant'));
    });

    // 3. Validation de la commande
    const checkoutButton = screen.getByText('Passer commande');
    
    // Attendre que AuthProvider ait fini son chargement interne
    await waitFor(() => {
      expect(checkoutButton).not.toBeDisabled();
    });

    fireEvent.click(checkoutButton);

    // Vérifier l'appel à la couche Infrastructure (Supabase)
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(toast.success).toHaveBeenCalledWith('Commande passée avec succès !');
    });

    // Vérifier le nettoyage du state UI
    expect(screen.getByText('Votre panier est vide')).toBeInTheDocument();
  });
});
