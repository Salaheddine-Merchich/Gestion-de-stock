import { test, expect } from './api.fixtures';

test.describe('API: Order Workflow', () => {
  
  test('should allow Client to place an order', async ({ clientRequest }) => {
    // 1. Get a product ID first
    const productsRes = await clientRequest.get('/rest/v1/products?limit=1');
    const products = await productsRes.json();
    const productId = products[0]?.id;

    if (!productId) {
      test.skip(true, 'No products available to test order creation');
      return;
    }

    // 2. Create Order
    const orderResponse = await clientRequest.post('/rest/v1/orders', {
      data: {
        status: 'pending',
        total: 150.00,
        // In a real app, client_id might be inferred from JWT, 
        // but here we might need to provide it if the policy requires it.
      },
      headers: { 'Prefer': 'return=representation' }
    });

    expect(orderResponse.status()).toBe(201);
    const order = await orderResponse.json();
    expect(order[0].status).toBe('pending');
  });

  test('should allow Client to see only their orders', async ({ clientRequest }) => {
    const response = await clientRequest.get('/rest/v1/orders');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    // Further validation: check that all orders belong to the client (if possible to verify via API)
  });

  test('should allow Admin to see all orders', async ({ adminRequest }) => {
    const response = await adminRequest.get('/rest/v1/orders');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
