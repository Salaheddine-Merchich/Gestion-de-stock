const http = require('http');
const PORT = 3001;

/**
 * Robust Mock API Server with Real UUIDs for UI/API Tests
 */

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const CLIENT_ID = '00000000-0000-0000-0000-000000000002';

let products = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Sucre de Table', price: 12.5, stock: 500, category_id: 'cat-1', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Pain de Sucre', price: 15.0, stock: 200, category_id: 'cat-1', created_at: new Date().toISOString() }
];

let categories = [
  { id: 'cat-1', name: 'Sucre Granulé', slug: 'sucre-granule' },
  { id: 'cat-2', name: 'Sucre en Morceaux', slug: 'sucre-morceaux' }
];

const server = http.createServer((req, res) => {
  // Simple Logger for CI Debugging
  console.log(`[MOCK] ${req.method} ${req.url}`);

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

  const authHeader = req.headers['authorization'] || '';
  const isAdmin = authHeader.includes('admin-token');
  
  // 1. Auth Endpoint
  if (req.url.includes('/auth/v1/token')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const role = data.email?.includes('admin') ? 'admin' : 'client';
      const userId = role === 'admin' ? ADMIN_ID : CLIENT_ID;
      
      res.writeHead(200);
      res.end(JSON.stringify({
        access_token: `valid-${role}-token`,
        token_type: 'bearer',
        expires_in: 3600,
        user: { 
          id: userId, 
          email: data.email || 'test@example.com', 
          aud: 'authenticated',
          role: 'authenticated',
          user_metadata: { full_name: 'Test ' + role },
          app_metadata: { provider: 'email' }
        }
      }));
    });
    return;
  }

  // 2. Profiles Endpoint
  if (req.url.includes('/rest/v1/profiles')) {
    const isRequestingAdmin = req.url.includes(ADMIN_ID) || isAdmin;
    const role = isRequestingAdmin ? 'admin' : 'client';
    const userId = isRequestingAdmin ? ADMIN_ID : CLIENT_ID;

    res.writeHead(200);
    const profile = { user_id: userId, role: role, full_name: 'Test ' + role, id: 'prof-' + userId };
    
    if (req.url.includes('single') || req.headers['prefer']?.includes('return=minimal')) {
       res.end(JSON.stringify(profile));
    } else {
       res.end(JSON.stringify([profile]));
    }
    return;
  }

  // 3. Products
  if (req.url.includes('/rest/v1/products')) {
    if (req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(products));
    } else if (req.method === 'POST') {
      if (!isAdmin) { res.writeHead(403); res.end(JSON.stringify({ error: 'Forbidden' })); return; }
      res.writeHead(201);
      res.end(JSON.stringify([{ id: 'new-id', name: 'Added' }]));
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  // 4. Categories & Orders (Minimal)
  if (req.url.includes('/rest/v1/categories')) {
    res.writeHead(200); res.end(JSON.stringify(categories)); return;
  }
  if (req.url.includes('/rest/v1/orders')) {
    res.writeHead(200); res.end(JSON.stringify([])); return;
  }

  // 5. Health Check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200); res.end(JSON.stringify({ status: 'ok' })); return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Robust API Mock Server started on http://0.0.0.0:${PORT}`);
});
