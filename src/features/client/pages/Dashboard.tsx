import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/infrastructure/api/supabase';
import { useAuth } from '@/application/contexts/AuthContext';
import { useCart } from '@/application/contexts/CartContext';
import { Product, Order } from '@/core/types/database';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { ShoppingCart, Package, Heart, Star } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { addItem, totalItems } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    accepted: 0,
    refused: 0,
    delivered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for order changes to refresh client dashboard from Supabase
    const handleOrderDeleted = () => {
      console.log('Order deleted - refreshing client dashboard from Supabase');
      fetchDashboardData();
    };
    
    const handleOrderDataChanged = () => {
      console.log('Order data changed - refreshing client dashboard from Supabase');
      fetchDashboardData();
    };
    
    // Listen for page visibility to refresh when coming back
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };
    
    window.addEventListener('orderDeleted', handleOrderDeleted);
    window.addEventListener('orderDataChanged', handleOrderDataChanged);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('orderDeleted', handleOrderDeleted);
      window.removeEventListener('orderDataChanged', handleOrderDataChanged);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch featured products (latest 4)
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Calculate order statistics
      const { data: allOrdersData } = await supabase
        .from('orders')
        .select('status')
        .eq('client_id', user?.id);

      const stats = {
        pending: allOrdersData?.filter(order => order.status === 'en_attente').length || 0,
        accepted: allOrdersData?.filter(order => order.status === 'accepte').length || 0,
        refused: allOrdersData?.filter(order => order.status === 'annule').length || 0,
        delivered: allOrdersData?.filter(order => order.status === 'livre').length || 0
      };

      setFeaturedProducts(productsData || []);
      setRecentOrders((ordersData || []) as Order[]);
      setOrderStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="secondary">En attente</Badge>;
      case 'accepte':
        return <Badge variant="default">Acceptée</Badge>;
      case 'livre':
        return <Badge variant="default" className="bg-green-500">Livrée</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-lg p-6">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bienvenue chez Cosumar !
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Découvrez nos produits sucriers de qualité supérieure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/">
                <Package className="h-5 w-5" />
                Explorer les produits
              </Link>
            </Button>
            {totalItems > 0 && (
              <Button variant="hero" size="lg" asChild>
                <Link to="/client/cart">
                  <ShoppingCart className="h-5 w-5" />
                  Mon panier ({totalItems})
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">commandes en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.accepted}</div>
            <p className="text-xs text-muted-foreground">commandes acceptées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.refused}</div>
            <p className="text-xs text-muted-foreground">commandes refusées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground">commandes livrées</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Commandes récentes</h2>
            <Button variant="outline" asChild>
              <Link to="/client/orders">Voir toutes</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.total.toFixed(2)} €</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Produits en vedette</h2>
          <Button variant="outline" asChild>
            <Link to="/">Voir tous les produits</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="p-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-md mb-2 flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-2">
                  <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                  {product.category && (
                    <p className="text-xs text-muted-foreground">
                      {product.category.name}
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary">
                    {product.price.toFixed(2)} €
                  </span>
                  {product.stock > 0 ? (
                    <Badge variant="secondary">En stock</Badge>
                  ) : (
                    <Badge variant="destructive">Rupture</Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  variant="gradient"
                  size="sm"
                  className="w-full"
                  onClick={() => addItem(product)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {product.stock === 0 ? 'Rupture' : 'Ajouter'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
