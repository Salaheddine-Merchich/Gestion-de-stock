import { useEffect, useState } from 'react';
import { supabase } from '@/infrastructure/api/supabase';
import { Category } from '@/core/types/database';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/presentation/components/ui/dialog';
import { Label } from '@/presentation/components/ui/label';
import { Plus, Edit, Trash2, Tags, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom de catégorie');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name.trim() })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Catégorie modifiée avec succès');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name: formData.name.trim() });

        if (error) throw error;
        toast.success('Catégorie créée avec succès');
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '' });
      fetchCategories();
      
      // Notifier les autres composants que les catégories ont changé
      window.dispatchEvent(new CustomEvent('categoriesChanged'));
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`ÃŠtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
      
      // Notifier les autres composants que les catégories ont changé
      window.dispatchEvent(new CustomEvent('categoriesChanged'));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Catégories</h1>
          <p className="text-muted-foreground">Organisez vos produits par catégories</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Ajouter une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Modifiez le nom de la catégorie'
                  : 'Ajoutez une nouvelle catégorie pour organiser vos produits'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Ex: Sucre blanc, Sucre roux..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="gradient" className="flex-1">
                  {editingCategory ? 'Modifier' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '' });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Rechercher des catégories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tags className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? 'Essayez avec d\'autres termes de recherche.'
              : 'Commencez par créer votre première catégorie.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Tags className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Créée le {new Date(category.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
