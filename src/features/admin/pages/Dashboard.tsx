import { useEffect, useState } from 'react';
import { supabase } from '@/infrastructure/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Package, ShoppingBag, Tags, Clock, Check, X, Truck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    refusedOrders: 0,
    deliveredOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Listen for order changes to refresh stats from Supabase
    const handleOrderDeleted = () => {
      console.log('Order deleted - refreshing admin dashboard stats from Supabase');
      fetchStats();
    };
    
    const handleOrderDataChanged = () => {
      console.log('Order data changed - refreshing admin dashboard stats from Supabase');
      fetchStats();
    };
    
    // Listen for page visibility to refresh when coming back
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
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
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, categoriesRes, pendingOrdersRes, acceptedOrdersRes, refusedOrdersRes, deliveredOrdersRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'en_attente'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'accepte'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'annule'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'livre'),
      ]);

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        acceptedOrders: acceptedOrdersRes.count || 0,
        refusedOrders: refusedOrdersRes.count || 0,
        deliveredOrders: deliveredOrdersRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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


  const statCards = [
    {
      title: 'Produits',
      value: stats.totalProducts,
      icon: Package,
      description: 'Total des produits',
      color: null
    },
    {
      title: 'Commandes',
      value: stats.totalOrders,
      icon: ShoppingBag,
      description: 'Total des commandes',
      color: null
    },
    {
      title: 'En attente',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'Commandes en attente',
      color: 'text-yellow-500'
    },
    {
      title: 'Acceptées',
      value: stats.acceptedOrders,
      icon: Check,
      description: 'Commandes acceptées',
      color: 'text-green-500'
    },
    {
      title: 'Refusées',
      value: stats.refusedOrders,
      icon: X,
      description: 'Commandes refusées',
      color: 'text-red-500'
    },
    {
      title: 'Livrées',
      value: stats.deliveredOrders,
      icon: Truck,
      description: 'Commandes livrées',
      color: 'text-blue-500'
    },
    {
      title: 'Catégories',
      value: stats.totalCategories,
      icon: Tags,
      description: 'Total des catégories',
      color: null
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Cosumar</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité sucre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
