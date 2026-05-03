import { test, expect } from './api.fixtures';
import { API_CONFIG } from './api.config';

test.describe('API: Authentication', () => {
  
  test('should login successfully with valid credentials', async ({ unauthRequest }) => {
    const response = await unauthRequest.post('/auth/v1/token?grant_type=password', {
      data: {
        email: API_CONFIG.admin.email,
        password: API_CONFIG.admin.password,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(body.user.email).toBe(API_CONFIG.admin.email);
  });

  test('should fail with invalid password', async ({ unauthRequest }) => {
    const response = await unauthRequest.post('/auth/v1/token?grant_type=password', {
      data: {
        email: API_CONFIG.admin.email,
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBe(400); // Supabase returns 400 for invalid credentials
    const body = await response.json();
    expect(body.error).toBe('invalid_grant');
  });

  test('should fail with missing credentials', async ({ unauthRequest }) => {
    const response = await unauthRequest.post('/auth/v1/token?grant_type=password', {
      data: {
        email: API_CONFIG.admin.email,
      },
    });

    expect(response.status()).toBe(400);
  });
});
