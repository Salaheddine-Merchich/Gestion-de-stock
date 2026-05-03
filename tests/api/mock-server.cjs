const http = require('http');
const PORT = 3001;

/**
 * Mock API Server for Playwright API Tests
 * This server simulates Supabase Auth and Rest endpoints.
 */

let products = [
  { id: 'prod-1', name: 'Sucre API Mock', price: 12.5, stock: 500, created_at: new Date().toISOString() }
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, prefer');

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
          user: { id: `${role}-uuid`, email: data.email }
        }));
      }
    });
    return;
  }

  // Check Token for other endpoints
  const authHeader = req.headers['authorization'];
  const isAdmin = authHeader === 'Bearer valid-admin-token';
  const isClient = authHeader === 'Bearer valid-client-token';

  if (!isAdmin && !isClient) {
     if (!req.url.includes('/rest/v1/products') || req.method !== 'GET') {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
     }
  }

  // 2. Products Endpoint
  if (req.url.includes('/rest/v1/products')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(products));
    } else if (req.method === 'POST') {
      if (!isAdmin) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Forbidden' }));
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
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // 3. Orders Endpoint
  if (req.url.includes('/rest/v1/orders')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify([{ id: 'order-mock-1', status: 'pending', total: 100 }]));
    } else if (req.method === 'POST') {
      res.writeHead(201);
      res.end(JSON.stringify([{ id: 'order-new', status: 'pending' }]));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`✅ API Mock Server started on http://localhost:${PORT}`);
});
