export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'client' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  total: number;
  status: 'en_attente' | 'accepte' | 'livre' | 'annule';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}