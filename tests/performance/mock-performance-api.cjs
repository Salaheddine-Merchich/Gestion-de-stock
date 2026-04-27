const http = require('http');

/**
 * Mock API Supabase pour les tests de performance k6.
 * Simule les endpoints utilisés par l'application avec une latence variable.
 */

const PORT = 3000;

// Génération de données factices
const products = Array.from({ length: 50 }, (_, i) => ({
  id: `prod-${i}`,
  name: `Sucre Cosumar Type-${i}`,
  price: (Math.random() * 50 + 10).toFixed(2),
  stock: Math.floor(Math.random() * 5000),
  created_at: new Date().toISOString()
}));

const server = http.createServer((req, res) => {
  // Simulation de latence réaliste (50ms à 350ms) pour tester les seuils k6
  const latency = Math.floor(Math.random() * 300) + 50;

  // Gestion des headers CORS pour k6
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, apikey, Content-Type, Prefer');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  setTimeout(() => {
    res.setHeader('Content-Type', 'application/json');

    // 1. Auth : Token
    if (req.url.includes('/auth/v1/token')) {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        access_token: 'mock-jwt-performance-token',
        token_type: 'bearer',
        user: { id: 'user-perf', email: 'admin@cosumar.test' }
      }));
    } 
    // 2. Rest : Products (GET)
    else if (req.url.includes('/rest/v1/products') && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(products));
    }
    // 3. Rest : Orders (Analyse lourde)
    else if (req.url.includes('/rest/v1/orders')) {
      res.writeHead(200);
      res.end(JSON.stringify([
        { id: 'order-perf-1', status: 'delivered', total: 450.00, order_items: products.slice(0, 3) }
      ]));
    }
    // 4. Rest : Products (PATCH)
    else if (req.url.includes('/rest/v1/products') && req.method === 'PATCH') {
      res.writeHead(204);
      res.end();
    }
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Endpoint non mocké' }));
    }
  }, latency);
});

server.listen(PORT, () => {
  console.log('================================================');
  console.log(`✅ SERVEUR DE MOCK PERFORMANCE ACTIF`);
  console.log(`📍 URL : http://localhost:${PORT}`);
  console.log(`⏱️ Latence simulée : 50ms - 350ms`);
  console.log('================================================');
});
