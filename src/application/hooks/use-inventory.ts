import { useState, useEffect } from 'react';
import { supabase } from '@/infrastructure/api/supabase';

export interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInventory() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  return { products, loading, error, refresh: fetchInventory };
}
