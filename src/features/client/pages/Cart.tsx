import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/application/contexts/AuthContext';
import { useCart } from '@/application/contexts/CartContext';
import { supabase } from '@/infrastructure/api/supabase';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Input } from '@/presentation/components/ui/input';
import { Separator } from '@/presentation/components/ui/separator';
import { ShoppingCart, Minus, Plus, Trash2, Package, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientCart() {
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;

    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          total: totalPrice,
          status: 'en_attente'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and redirect to invoice
      clearCart();
      toast.success('Commande passée avec succès !');
      navigate(`/client/invoice/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon Panier</h1>
          <p className="text-muted-foreground">Gérez vos articles</p>
        </div>

        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Votre panier est vide
          </h3>
          <p className="text-muted-foreground mb-6">
            Découvrez nos produits et ajoutez-les à votre panier.
          </p>
          <Button variant="gradient" asChild>
            <Link to="/">
              <Package className="h-4 w-4" />
              Voir les produits
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Panier</h1>
        <p className="text-muted-foreground">{totalItems} article{totalItems > 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">
                      {item.product.name}
                    </h3>
                    {item.product.category && (
                      <p className="text-sm text-muted-foreground">
                        {item.product.category.name}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">
                      {item.product.price.toFixed(2)} €
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtotal */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sous-total:</span>
                    <span className="font-semibold">
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total ({totalItems} articles)</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livraison</span>
                  <span className="text-green-600">Gratuite</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{totalPrice.toFixed(2)} €</span>
              </div>
              
              <Button
                variant="gradient"
                className="w-full"
                onClick={handleCheckout}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4" />
                {loading ? 'Traitement...' : 'Passer commande'}
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link to="/">
                  Continuer mes achats
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
