import { useEffect, useState } from 'react';
import { supabase } from '@/infrastructure/api/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Package, Check, X, Eye, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderWithItems {
  id: string;
  client_id: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image_url: string | null;
    };
  }[];
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch fresh data when component mounts or when coming back to this page
    fetchOrders();
    
    // Listen for order deletions to refresh the list
    const handleOrderDeleted = () => {
      fetchOrders(); // Always refetch from Supabase to ensure consistency
    };
    
    // Listen for visibility changes to refetch when user comes back to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders();
      }
    };
    
    window.addEventListener('orderDeleted', handleOrderDeleted);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('orderDeleted', handleOrderDeleted);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remove dependency on user to always refetch

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(id, name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile data for each order
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', order.client_id)
              .maybeSingle();
            
            return {
              ...order,
              profiles: profile || { first_name: 'Client', last_name: 'Inconnu' }
            };
          } catch (error) {
            console.error('Error fetching profile for order:', order.id, error);
            return {
              ...order,
              profiles: { first_name: 'Client', last_name: 'Inconnu' }
            };
          }
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      const statusText = newStatus === 'accepte' ? 'acceptée' : newStatus === 'livre' ? 'livrée' : 'refusée';
      toast.success(`Commande ${statusText}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('ÃŠtes-vous sûr de vouloir supprimer définitivement cette commande ? Cette action est irréversible.')) {
      return;
    }

    setDeletingOrder(orderId);
    try {
      // First delete all order items (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order itself
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Remove from local state immediately
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('orderDeleted', { 
        detail: { 
          orderId,
          timestamp: Date.now()
        } 
      }));
      
      // Also trigger a custom event for dashboard stats refresh
      window.dispatchEvent(new CustomEvent('orderDataChanged'));
      
      toast.success('Commande supprimée définitivement de Supabase');
      
      // Optionally refetch to ensure absolute consistency with database
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
    } catch (error) {
      console.error('Error deleting order from Supabase:', error);
      toast.error('Erreur lors de la suppression définitive');
    } finally {
      setDeletingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en_attente': { variant: 'secondary' as const, label: 'En attente', icon: Clock },
      'accepte': { variant: 'default' as const, label: 'Acceptée', icon: Check },
      'livre': { variant: 'secondary' as const, label: 'Livrée', icon: Package },
      'annule': { variant: 'destructive' as const, label: 'Annulée', icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.en_attente;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des Commandes Cosumar</h1>
        <p className="text-muted-foreground">
          Gérez et validez les commandes de sucre des clients
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aucune commande trouvée
          </h3>
          <p className="text-muted-foreground">
            Les commandes des clients apparaîtront ici.
          </p>
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
                      Client: {order.profiles?.first_name} {order.profiles?.last_name}
                      <br />
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Articles commandés :</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground text-sm">{item.product?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Quantité : {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground text-sm">
                              {item.price.toFixed(2)} € / unité
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total : {(item.price * item.quantity).toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.status === 'en_attente' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'accepte')}
                        disabled={updatingOrder === order.id}
                      >
                        <Check className="h-4 w-4" />
                        Accepter
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'annule')}
                        disabled={updatingOrder === order.id}
                      >
                        <X className="h-4 w-4" />
                        Refuser
                      </Button>
                    </div>
                  )}

                  {order.status === 'accepte' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'livre')}
                        disabled={updatingOrder === order.id}
                      >
                        <Package className="h-4 w-4" />
                        Marquer comme livrée
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteOrder(order.id)}
                      disabled={deletingOrder === order.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingOrder === order.id ? 'Suppression...' : 'Supprimer définitivement'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
