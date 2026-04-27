import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/application/contexts/AuthContext';
import { useCart } from '@/application/contexts/CartContext';
import { Button } from '@/presentation/components/ui/enhanced-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { Badge } from '@/presentation/components/ui/badge';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Package, 
  Home,
  Menu,
  ShoppingBag
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ClientLayout() {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { 
      icon: Home, 
      label: 'Accueil', 
      path: '/client/dashboard' 
    },
    { 
      icon: Package, 
      label: 'Produits', 
      path: '/' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Mon Panier', 
      path: '/client/cart',
      badge: totalItems > 0 ? totalItems : undefined
    },
    { 
      icon: ShoppingBag, 
      label: 'Mes Commandes', 
      path: '/client/orders' 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-2 ml-4 md:ml-0">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Cosumar</span>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {/* Cart Icon */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative"
            >
              <Link to="/client/cart">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">
                    <Home className="h-4 w-4 mr-2" />
                    Retour au site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 border-r bg-muted/50 transition-all duration-300 fixed inset-y-0 left-0 top-16 z-40 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:ml-0">
          <Outlet />
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
