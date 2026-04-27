import { z } from 'zod';

/**
 * Schéma de validation pour la création/édition d'un produit
 */
export const productSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  price: z.number().positive("Le prix doit être positif"),
  stock: z.number().int().min(0, "Le stock ne peut pas être négatif"),
  category_id: z.string().uuid("Catégorie invalide"),
  description: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
