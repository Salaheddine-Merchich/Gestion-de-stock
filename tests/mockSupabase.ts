import { Page, Route } from '@playwright/test';

export class SupabaseMock {
  products: any[] = [];
  categories: any[] = [];
  orders: any[] = [];
  order_items: any[] = [];
  profiles: any[] = [];

  constructor() {
    // Initial State
    this.categories = [
      { id: 'cat-1', name: 'Sucre Blanc', created_at: new Date().toISOString() },
      { id: 'cat-2', name: 'Sucre Roux', created_at: new Date().toISOString() },
    ];

    this.products = [
      {
        id: 'prod-1',
        name: 'Sucre Blanc 50kg',
        price: 45.00,
        stock: 200,
        description: 'Sucre raffiné de haute qualité',
        category_id: 'cat-1',
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    this.orders = [
      {
        id: 'order-1',
        client_id: 'client-uuid',
        total: 90.00,
        status: 'en_attente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    this.order_items = [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        quantity: 2,
        price: 45.00
      }
    ];

    this.profiles = [
      { user_id: 'admin-uuid', first_name: 'Admin', last_name: 'Test', role: 'admin' },
      { user_id: 'client-uuid', first_name: 'Client', last_name: 'Test', role: 'client' }
    ];
  }

  async setupMocks(page: Page) {
    const CORS_HEADERS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    };

    // Global OPTIONS handler for preflight requests
    await page.route('**/*.supabase.co/**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 200, headers: CORS_HEADERS });
      }
      route.fallback();
    });

    // 1. Auth Mocks
    await page.route('**/auth/v1/token*', async (route) => {
      const body = route.request().postData() || '';
      const email = body.match(/"email":"([^"]+)"/)?.[1] || '';
      const isClient = email.includes('client');
      const userId = isClient ? 'client-uuid' : 'admin-uuid';
      const role = isClient ? 'client' : 'admin';

      // Simulate network delay
      await new Promise(r => setTimeout(r, 100));

      if (email === 'mauvais@email.com') {
         return route.fulfill({
            status: 400,
            headers: CORS_HEADERS,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'invalid_credentials', error_description: 'Invalid login credentials' })
         });
      }

      await route.fulfill({
        status: 200,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: email,
          }
        })
      });
    });

    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'client-uuid',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'client@cosumar.test',
        })
      });
    });

    await page.route('**/auth/v1/signup*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-user-uuid',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'newuser@test.com',
        })
      });
    });
    
    await page.route('**/auth/v1/logout*', async (route) => {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
    });

    // 2. REST API Mocks
    
    // Profiles
    await page.route('**/rest/v1/profiles*', async (route) => {
      const url = route.request().url();
      const accept = route.request().headers()['accept'] || '';
      const wantsSingle = accept.includes('application/vnd.pgrst.object+json');

      if (url.includes('user_id=eq.')) {
         const match = url.match(/user_id=eq\.([^&]+)/);
         const userId = match ? match[1] : '';
         const profile = this.profiles.find(p => p.user_id === userId) || this.profiles[0];
         return route.fulfill({
            status: 200,
            headers: CORS_HEADERS,
            contentType: 'application/json',
            body: JSON.stringify(wantsSingle ? profile : [profile])
         });
      }
      
      await route.fulfill({
        status: 200,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify(wantsSingle ? this.profiles[0] : this.profiles)
      });
    });

    // Categories
    await page.route('**/rest/v1/categories*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'HEAD') {
        return route.fulfill({ status: 200, headers: { ...CORS_HEADERS, 'content-range': `0-${this.categories.length - 1}/${this.categories.length}` }});
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: CORS_HEADERS,
          contentType: 'application/json',
          body: JSON.stringify(this.categories)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newCat = { ...body, id: `cat-${Date.now()}`, created_at: new Date().toISOString() };
        this.categories.push(newCat);
        await route.fulfill({ status: 201, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([newCat]) });
      } else if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            const index = this.categories.findIndex(c => c.id === idMatch[1]);
            if (index > -1) {
                this.categories[index] = { ...this.categories[index], ...body };
            }
        }
        await route.fulfill({ status: 200, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (method === 'DELETE') {
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            this.categories = this.categories.filter(c => c.id !== idMatch[1]);
        }
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
      } else {
        await route.fallback();
      }
    });

    // Products
    await page.route('**/rest/v1/products*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'HEAD') {
        return route.fulfill({ status: 200, headers: { ...CORS_HEADERS, 'content-range': `0-${this.products.length - 1}/${this.products.length}` }});
      }
      
      if (method === 'GET') {
        const productsWithCats = this.products.map(p => ({
          ...p,
          category: this.categories.find(c => c.id === p.category_id) || null
        }));
        
        await route.fulfill({
          status: 200,
          headers: CORS_HEADERS,
          contentType: 'application/json',
          body: JSON.stringify(productsWithCats)
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newProd = { ...body, id: `prod-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        this.products.push(newProd);
        await route.fulfill({ status: 201, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([newProd]) });
      } else if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            const index = this.products.findIndex(p => p.id === idMatch[1]);
            if (index > -1) {
                this.products[index] = { ...this.products[index], ...body };
            }
        }
        await route.fulfill({ status: 200, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (method === 'DELETE') {
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            this.products = this.products.filter(p => p.id !== idMatch[1]);
        }
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
      } else {
        await route.fallback();
      }
    });

    // Orders
    await page.route('**/rest/v1/orders*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'HEAD') {
        let count = this.orders.length;
        if (url.includes('status=eq.en_attente')) count = this.orders.filter(o => o.status === 'en_attente').length;
        if (url.includes('status=eq.accepte')) count = this.orders.filter(o => o.status === 'accepte').length;
        if (url.includes('status=eq.annule')) count = this.orders.filter(o => o.status === 'annule').length;
        if (url.includes('status=eq.livre')) count = this.orders.filter(o => o.status === 'livre').length;
        return route.fulfill({ status: 200, headers: { ...CORS_HEADERS, 'content-range': count > 0 ? `0-${count - 1}/${count}` : '*/0' }});
      }

      if (method === 'GET') {
        let filteredOrders = this.orders;
        const parsedUrl = new URL(url);
        const idEq = parsedUrl.searchParams.get('id');
        if (idEq && idEq.startsWith('eq.')) {
            const orderId = idEq.replace('eq.', '');
            filteredOrders = filteredOrders.filter(o => o.id === orderId);
        }

        const ordersWithItems = filteredOrders.map(o => ({
          ...o,
          profiles: this.profiles.find(p => p.user_id === o.client_id) || null,
          order_items: this.order_items.filter(i => i.order_id === o.id).map(i => ({
             ...i,
             product: this.products.find(p => p.id === i.product_id) || null
          }))
        }));

        const accept = route.request().headers()['accept'] || '';
        const wantsSingle = accept.includes('application/vnd.pgrst.object+json');

        await route.fulfill({
          status: 200,
          headers: CORS_HEADERS,
          contentType: 'application/json',
          body: JSON.stringify(wantsSingle ? (ordersWithItems[0] || null) : ordersWithItems)
        });
      } else if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            const index = this.orders.findIndex(o => o.id === idMatch[1]);
            if (index > -1) {
                this.orders[index] = { ...this.orders[index], ...body };
            }
        }
        await route.fulfill({ status: 200, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (method === 'DELETE') {
        const idMatch = url.match(/eq\.([^&]+)/);
        if (idMatch) {
            this.orders = this.orders.filter(o => o.id !== idMatch[1]);
        }
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newOrder = { ...body, id: `order-${Date.now()}`, created_at: new Date().toISOString() };
        this.orders.push(newOrder);
        const accept = route.request().headers()['accept'] || '';
        const wantsSingle = accept.includes('application/vnd.pgrst.object+json');
        await route.fulfill({ status: 201, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify(wantsSingle ? newOrder : [newOrder]) });
      } else {
        await route.fallback();
      }
    });

    // Order Items
    await page.route('**/rest/v1/order_items*', async (route) => {
       const method = route.request().method();
       if (method === 'DELETE') {
         await route.fulfill({ status: 204, headers: CORS_HEADERS });
       } else if (method === 'POST') {
         await route.fulfill({ status: 201, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify([]) });
       } else {
         await route.fallback();
       }
    });
  }
}
