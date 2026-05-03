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
        res.end(JSON.stringify({
          access_token: `valid-${role}-token`,
          token_type: 'bearer',
          user: { id: `${role}-uuid`, email: data.email, user_metadata: { full_name: 'User ' + role } }
        }));
      }
    });
    return;
  }

  // Check Token for other endpoints
  const authHeader = req.headers['authorization'];
  const isAdmin = authHeader === 'Bearer valid-admin-token';
  const isClient = authHeader === 'Bearer valid-client-token';

  // 2. Profiles Endpoint (Essential for RBAC and Layouts)
  if (req.url.includes('/rest/v1/profiles')) {
    const role = isAdmin ? 'admin' : 'client';
    const userId = isAdmin ? 'admin-uuid' : 'client-uuid';
    res.writeHead(200);
    // Return a single profile if requested or a list
    if (req.url.includes('single')) {
       res.end(JSON.stringify({ user_id: userId, role: role, full_name: 'Test ' + role }));
    } else {
       res.end(JSON.stringify([{ user_id: userId, role: role, full_name: 'Test ' + role }]));
    }
    return;
  }

  // 3. Products Endpoint
  if (req.url.includes('/rest/v1/products')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(products.map(p => ({ ...p, categories: categories.find(c => c.id === p.category_id) }))));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        const data = JSON.parse(body || '{}');
        const newProd = { ...data, id: 'api-prod-' + Date.now() };
        res.writeHead(201);
        res.end(JSON.stringify([newProd]));
      });
    } else if (req.method === 'PATCH' || req.method === 'DELETE') {
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

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found', url: req.url }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Robust API Mock Server started on http://127.0.0.1:${PORT}`);
});
