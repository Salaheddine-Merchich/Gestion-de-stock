const http = require('http');
const PORT = 3001;

/**
 * Final Ultra-Faithful Supabase Mock Server
 */

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const CLIENT_ID = '00000000-0000-0000-0000-000000000002';
const CAT_ID = '00000000-0000-0000-0000-000000000003';

let products = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Sucre de Table', price: 12.5, stock: 500, category_id: CAT_ID, created_at: new Date().toISOString() }
];

const server = http.createServer((req, res) => {
  console.log(`[MOCK] ${req.method} ${req.url}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, prefer, x-client-info');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers['authorization'] || '';
  const isAdmin = authHeader.includes('admin-token');

  // 1. AUTH
  if (req.url.includes('/auth/v1/token')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      if (!data.email || !data.password || data.password === 'wrong-password') {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid credentials' }));
        return;
      }
      const role = data.email.includes('admin') ? 'admin' : 'client';
      const userId = role === 'admin' ? ADMIN_ID : CLIENT_ID;
      res.writeHead(200);
      res.end(JSON.stringify({
        access_token: `valid-${role}-token`,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: { 
          id: userId, email: data.email, aud: 'authenticated', role: 'authenticated',
          user_metadata: { full_name: 'Test ' + role },
          app_metadata: { provider: 'email' },
          last_sign_in_at: new Date().toISOString()
        }
      }));
    });
    return;
  }

  // 2. PROFILES
  if (req.url.includes('/rest/v1/profiles')) {
    const isRequestingAdmin = req.url.includes(ADMIN_ID) || isAdmin;
    const profile = { user_id: isRequestingAdmin ? ADMIN_ID : CLIENT_ID, role: isRequestingAdmin ? 'admin' : 'client', full_name: 'Test User' };
    res.writeHead(200);
    // Important: Supabase .single() returns object, not array
    res.end(JSON.stringify(req.headers['prefer']?.includes('return=minimal') || req.url.includes('single') ? profile : [profile]));
    return;
  }

  // 3. PRODUCTS
  if (req.url.includes('/rest/v1/products')) {
    if (req.method === 'POST') {
      if (!isAdmin) { res.writeHead(403); res.end(JSON.stringify({ error: 'Forbidden' })); return; }
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        const data = JSON.parse(body || '{}');
        res.writeHead(201);
        res.end(JSON.stringify([{ ...data, id: 'new-prod-id' }]));
      });
      return;
    }
    if (req.method === 'PATCH' || req.method === 'DELETE') {
      res.writeHead(204); // MUST BE 204 FOR UPDATE/DELETE
      res.end();
      return;
    }
    res.writeHead(200); res.end(JSON.stringify(products)); return;
  }

  // 4. CATEGORIES & ORDERS
  if (req.url.includes('/rest/v1/categories')) {
    res.writeHead(200); res.end(JSON.stringify([{ id: CAT_ID, name: 'Sucre' }])); return;
  }
  if (req.url.includes('/rest/v1/orders')) {
    if (req.method === 'POST') { res.writeHead(201); res.end(JSON.stringify([{ id: 'order-id' }])); return; }
    res.writeHead(200); res.end(JSON.stringify([])); return;
  }

  // 5. HEALTH
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200); res.end(JSON.stringify({ status: 'ok' })); return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Robust API Mock Server started on http://0.0.0.0:${PORT}`);
});
