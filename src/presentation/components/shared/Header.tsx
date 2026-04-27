import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Settings, Package } from 'lucide-react';
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

export function Header() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Cosumar</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Accueil
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart - Only for clients */}
                {profile?.role === 'client' && (
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
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Menu utilisateur">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {profile?.role === 'client' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/client/orders" className="cursor-pointer">
                            <Package className="h-4 w-4 mr-2" />
                            Mes commandes
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                     {isAdmin && (
                       <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                           <Link to="/admin/dashboard" className="cursor-pointer">
                             <Settings className="h-4 w-4 mr-2" />
                             Administration
                           </Link>
                         </DropdownMenuItem>
                       </>
                     )}
                     {!isAdmin && user && (
                       <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                           <Link to="/client/dashboard" className="cursor-pointer">
                             <User className="h-4 w-4 mr-2" />
                             Mon espace
                           </Link>
                         </DropdownMenuItem>
                       </>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth">Se connecter</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/auth">S'inscrire</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
