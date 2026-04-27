import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/infrastructure/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Separator } from '@/presentation/components/ui/separator';
import { Package, ArrowLeft, Download, Check } from 'lucide-react';

interface OrderWithItems {
  id: string;
  client_id: string;
  total: number;
  status: string;
  created_at: string;
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

export default function ClientInvoice() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
    
    // Listen for order deletions to refresh or redirect
    const handleOrderDeleted = (event: CustomEvent) => {
      if (event.detail.orderId === orderId) {
        // If this specific order was deleted, show error message
        setOrder(null);
      }
    };
    
    window.addEventListener('orderDeleted', handleOrderDeleted as EventListener);
    
    return () => {
      window.removeEventListener('orderDeleted', handleOrderDeleted as EventListener);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(id, name, image_url)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      // Fetch profile data for the order
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', data.client_id)
        .single();
      
      setOrder({
        ...data,
        profiles: profile
      });
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Facture introuvable
          </h3>
          <p className="text-muted-foreground mb-6">
            Cette facture n'existe pas ou vous n'y avez pas accès.
          </p>
          <Button variant="outline" asChild>
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4" />
              Retour aux commandes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const invoiceDate = new Date(order.created_at);
  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facture de Commande</h1>
          <p className="text-muted-foreground">
            Facture générée automatiquement pour votre commande
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/client/orders">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
          <Button variant="gradient" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Cosumar</span>
          </div>
          <CardTitle className="text-2xl">
            {order.status === 'en_attente' && 'Facture Provisoire'}
            {order.status === 'accepte' && 'Facture Confirmée'}
            {order.status === 'annule' && 'Facture Refusée'}
            {order.status === 'livre' && 'Facture - Commande Livrée'}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            {order.status === 'en_attente' && (
              <>
                <div className="h-5 w-5 rounded-full bg-yellow-500" />
                <span className="text-yellow-600 font-medium">En attente de validation</span>
              </>
            )}
            {order.status === 'accepte' && (
              <>
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">Commande confirmée</span>
              </>
            )}
            {order.status === 'annule' && (
              <>
                <div className="h-5 w-5 rounded-full bg-red-500" />
                <span className="text-red-600 font-medium">Commande refusée</span>
              </>
            )}
            {order.status === 'livre' && (
              <>
                <Check className="h-5 w-5 text-blue-500" />
                <span className="text-blue-600 font-medium">Commande livrée</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Facturé à :</h3>
              <div className="text-muted-foreground">
                <p className="font-medium">{order.profiles?.first_name} {order.profiles?.last_name}</p>
                <p>Commande #{order.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <h3 className="font-semibold text-foreground mb-2">Détails de la facture :</h3>
              <div className="text-muted-foreground">
                <p>NÂ° Facture : <span className="font-medium">{invoiceNumber}</span></p>
                <p>Date : <span className="font-medium">
                  {invoiceDate.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span></p>
                <p>Heure : <span className="font-medium">
                  {invoiceDate.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span></p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Articles commandés</h3>
            <div className="space-y-4">
              {order.order_items?.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-muted/30 rounded-lg">
                  <div className="col-span-1 text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="col-span-2">
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
                  </div>
                  <div className="col-span-4">
                    <p className="font-medium text-foreground">{item.product?.name}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-muted-foreground">{item.quantity}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-muted-foreground">{item.price.toFixed(2)} €</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="font-medium text-foreground">
                      {(item.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total :</span>
              <span>{order.total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Livraison :</span>
              <span className="text-green-600">Gratuite</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA :</span>
              <span>Incluse</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total :</span>
              <span className="text-primary">{order.total.toFixed(2)} €</span>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Merci pour votre commande !</p>
            <p>Cette facture a été générée automatiquement par Cosumar.</p>
            <p>Pour toute question, contactez notre service client.</p>
            {order.status === 'en_attente' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 font-medium">
                  Cette facture est provisoire en attendant la validation de votre commande.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
