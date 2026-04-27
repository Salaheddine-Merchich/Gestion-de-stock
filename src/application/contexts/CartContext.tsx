import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '@/core/types/database';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.find(item => item.product.id === action.product.id);
      
      if (existingItem) {
        return state.map(item =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + action.quantity }
            : item
        );
      } else {
        return [...state, { product: action.product, quantity: action.quantity }];
      }
    }
    
    case 'REMOVE_ITEM':
      return state.filter(item => item.product.id !== action.productId);
    
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return state.filter(item => item.product.id !== action.productId);
      }
      return state.map(item =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
    
    case 'CLEAR_CART':
      return [];
    
    case 'LOAD_CART':
      return action.items;
    
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', items: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const addItem = (product: Product, quantity = 1) => {
    if (quantity > product.stock) {
      toast.error(`Stock insuffisant. Seulement ${product.stock} article(s) disponible(s).`);
      return;
    }
    
    dispatch({ type: 'ADD_ITEM', product, quantity });
    toast.success(`${product.name} ajouté au panier`);
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
    toast.success('Article retiré du panier');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.find(item => item.product.id === productId);
    if (item && quantity > item.product.stock) {
      toast.error(`Stock insuffisant. Seulement ${item.product.stock} article(s) disponible(s).`);
      return;
    }
    
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Panier vidé');
  };

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
