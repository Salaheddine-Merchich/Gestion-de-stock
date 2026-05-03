const http = require('http');
const PORT = 3001;

/**
 * Robust Mock API Server for Playwright UI & API Tests
 * This server simulates Supabase Auth and Rest endpoints with sufficient data for dashboards.
 */

let products = [
  { id: 'prod-1', name: 'Sucre de Table', price: 12.5, stock: 500, category_id: 'cat-1', created_at: new Date().toISOString() },
  { id: 'prod-2', name: 'Pain de Sucre', price: 15.0, stock: 200, category_id: 'cat-1', created_at: new Date().toISOString() }
];

let categories = [
  { id: 'cat-1', name: 'Sucre Granulé', slug: 'sucre-granule' },
  { id: 'cat-2', name: 'Sucre en Morceaux', slug: 'sucre-morceaux' }
];

let orders = [
  { id: 'order-1', client_id: 'client-uuid', status: 'pending', total_amount: 125.0, created_at: new Date().toISOString() }
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, prefer, x-client-info');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Helper to get token role
  const authHeader = req.headers['authorization'] || '';
  const isAdmin = authHeader.includes('admin-token');
  const isClient = authHeader.includes('client-token');

  // 1. Auth Endpoint
  if (req.url.includes('/auth/v1/token')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      if (!data.email || !data.password) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_request', error_description: 'Missing email or password' }));
      } else if (data.password === 'wrong-password') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }));
      } else {
        res.writeHead(200);
        const role = data.email.includes('admin') ? 'admin' : 'client';
        const userId = role === 'admin' ? 'admin-uuid' : 'client-uuid';
        res.end(JSON.stringify({
          access_token: `valid-${role}-token`,
          token_type: 'bearer',
          expires_in: 3600,
          user: { 
            id: userId, 
            email: data.email, 
            aud: 'authenticated',
            role: 'authenticated',
            user_metadata: { full_name: 'Test ' + role },
            app_metadata: { provider: 'email', providers: ['email'] }
          }
        }));
      }
    });
    return;
  }

  // 2. Profiles Endpoint (RBAC)
  if (req.url.includes('/rest/v1/profiles')) {
    // Determine role from URL query or token
    let role = 'client';
    let userId = 'client-uuid';
    
    if (req.url.includes('admin-uuid') || isAdmin) {
      role = 'admin';
      userId = 'admin-uuid';
    }

    res.writeHead(200);
    const profile = { user_id: userId, role: role, full_name: 'Test ' + role, id: 'prof-' + userId };
    
    if (req.headers['prefer']?.includes('return=minimal') || req.url.includes('single')) {
       res.end(JSON.stringify(profile));
    } else {
       res.end(JSON.stringify([profile]));
    }
    return;
  }

  // 3. Products Endpoint
  if (req.url.includes('/rest/v1/products')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(products.map(p => ({ ...p, categories: categories.find(c => c.id === p.category_id) }))));
    } else if (req.method === 'POST') {
      if (!isAdmin) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Unauthorized', message: 'Admin access required' }));
        return;
      }
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        const data = JSON.parse(body || '{}');
        const newProd = { ...data, id: 'api-prod-' + Date.now() };
        res.writeHead(201);
        res.end(JSON.stringify([newProd]));
      });
    } else if (req.method === 'PATCH' || req.method === 'DELETE') {
      if (!isAdmin) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // 4. Categories Endpoint
  if (req.url.includes('/rest/v1/categories')) {
    res.writeHead(200);
    res.end(JSON.stringify(categories));
    return;
  }

  // 5. Orders Endpoint
  if (req.url.includes('/rest/v1/orders')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(orders));
    } else if (req.method === 'POST') {
      res.writeHead(201);
      res.end(JSON.stringify([{ id: 'order-new', status: 'pending' }]));
    }
    return;
  }

  // 6. Health Check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found', url: req.url }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Robust API Mock Server started on http://0.0.0.0:${PORT}`);
});
