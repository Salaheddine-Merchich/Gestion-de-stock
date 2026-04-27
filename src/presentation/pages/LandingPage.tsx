import { useEffect, useState } from 'react';
import { useAuth } from '@/application/contexts/AuthContext';
import { supabase } from '@/infrastructure/api/supabase';
import { Product, Category } from '@/core/types/database';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { useCart } from '@/application/contexts/CartContext';
import { ShoppingCart, Search, Package, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Cosumar
              <br />
              <span className="text-primary">Produits sucriers de qualité</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez notre large gamme de produits sucriers Cosumar de qualité supérieure.
              Livraison rapide et service client de qualité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="#products">
                  <Package className="h-5 w-5" />
                  Découvrir nos produits
                </Link>
              </Button>
              {!user && (
                <Button variant="hero" size="lg" asChild>
                  <Link to="/auth?tab=signup">
                    <Star className="h-5 w-5" />
                    Créer un compte
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section id="products" className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            Nos Produits
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="p-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                      {product.stock > 0 ? (
                        <Badge variant="secondary">
                          En stock
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Rupture
                        </Badge>
                      )}
                    </div>
                    {product.category && (
                      <p className="text-sm text-muted-foreground">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  {product.description && (
                    <CardDescription className="line-clamp-2 mb-4">
                      {product.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {product.price.toFixed(2)} €
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  {user && profile?.role === 'client' ? (
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => addItem(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </Button>
                  ) : user && profile?.role === 'admin' ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <Package className="h-4 w-4" />
                      Espace administrateur
                    </Button>
                  ) : (
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/auth">
                        <Sparkles className="h-4 w-4" />
                        Se connecter pour acheter
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;

