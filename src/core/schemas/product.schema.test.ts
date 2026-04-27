import { describe, it, expect } from 'vitest';
import { productSchema } from './product.schema';

describe('Product Schema Validation', () => {
  const validProduct = {
    name: 'Sucre Blanc 50kg',
    price: 450.50,
    stock: 100,
    category_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
  };

  it('should validate a correct product', () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject a name too short', () => {
    const result = productSchema.safeParse({ ...validProduct, name: 'Su' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('3 caractères');
    }
  });

  it('should reject a negative price', () => {
    const result = productSchema.safeParse({ ...validProduct, price: -10 });
    expect(result.success).toBe(false);
  });

  it('should reject a negative stock', () => {
    const result = productSchema.safeParse({ ...validProduct, stock: -5 });
    expect(result.success).toBe(false);
  });

  it('should reject an invalid category UUID', () => {
    const result = productSchema.safeParse({ ...validProduct, category_id: 'invalid-id' });
    expect(result.success).toBe(false);
  });
});
