import { test, expect } from './api.fixtures';

test.describe('API: Product Management', () => {
  let createdProductId: string;

  test('should list products as Client', async ({ clientRequest }) => {
    const response = await clientRequest.get('/rest/v1/products?select=*');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should create a product as Admin', async ({ adminRequest }) => {
    const productData = {
      name: `API Test Product ${Date.now()}`,
      description: 'Created via API Testing Suite',
      price: 99.99,
      stock: 10,
      category_id: null // Assuming nullable for test
    };

    const response = await adminRequest.post('/rest/v1/products', {
      data: productData,
      headers: { 'Prefer': 'return=representation' }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body[0].name).toBe(productData.name);
    createdProductId = body[0].id;
  });

  test('should fail to create a product as Client (Authorization check)', async ({ clientRequest }) => {
    const response = await clientRequest.post('/rest/v1/products', {
      data: { name: 'Forbidden Product', price: 10 },
    });

    // If RLS is correctly set up, this should fail (usually 403 or 401 depending on policy)
    // Or it might return 201 but fail to actually insert if check policies are used, 
    // but usually it's a 403 for Insert policy violation.
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should update a product as Admin', async ({ adminRequest }) => {
    const response = await adminRequest.patch(`/rest/v1/products?id=eq.${createdProductId}`, {
      data: { stock: 50 },
    });

    expect(response.status()).toBe(204);
  });

  test('should delete a product as Admin', async ({ adminRequest }) => {
    const response = await adminRequest.delete(`/rest/v1/products?id=eq.${createdProductId}`);
    expect(response.status()).toBe(204);
  });
});
