import { useEffect, useState } from 'react';
import { useAuth } from '@/application/contexts/AuthContext';
import { supabase } from '@/infrastructure/api/supabase';
import { Order, OrderItem } from '@/core/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Package, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // Listen for order changes to refresh client orders from Supabase
    const handleOrderDeleted = () => {
      console.log('Order deleted - refreshing client orders from Supabase');
      fetchOrders();
    };
    
    const handleOrderDataChanged = () => {
      console.log('Order data changed - refreshing client orders from Supabase');
      fetchOrders();
    };
    
    // Listen for page visibility to refresh when coming back
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders();
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

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en_attente': { variant: 'secondary' as const, label: 'En attente' },
      'accepte': { variant: 'default' as const, label: 'Acceptée' },
      'livre': { variant: 'secondary' as const, label: 'Livrée' },
      'annule': { variant: 'destructive' as const, label: 'Annulée' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.en_attente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Commandes</h1>
          <p className="text-muted-foreground">
            Consultez l'historique de vos commandes et leur statut
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/client/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aucune commande trouvée
          </h3>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore passé de commande.
          </p>
          <Button variant="gradient" asChild>
            <Link to="/">
              <Package className="h-4 w-4" />
              Découvrir nos produits
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Commande #{order.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <div className="text-lg font-bold text-primary mt-1">
                      {order.total.toFixed(2)} €
                    </div>
                    <Button variant="outline" size="sm" asChild className="mt-2">
                      <Link to={`/client/invoice/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        Voir facture
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Articles commandés :</h4>
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité : {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {item.price.toFixed(2)} € / unité
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total : {(item.price * item.quantity).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
