import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * K6 Load Test — Gestion de Stock Cosumar
 * ========================================
 * 
 * Ce script simule une charge utilisateur sur l'API Supabase.
 * Couches testées : Auth, Lecture (Browse/Search), Écriture (Update).
 */

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up: 0 à 50 VUs
    { duration: '2m', target: 50 },   // Plateau: 50 VUs
    { duration: '30s', target: 200 }, // Stress: Pic à 200 VUs
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],   // Taux d'erreur < 1%
  },
};

// Variables d'environnement (injectées via -e)
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'admin@test.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'password123';

export default function () {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  };

  // 1. AUTH : Connexion pour récupérer le JWT
  const authPayload = JSON.stringify({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  const authRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, authPayload, { headers });
  
  const authSuccess = check(authRes, {
    'auth status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('access_token') !== undefined,
  });

  if (!authSuccess) {
    console.error(`Auth failed for ${TEST_USER_EMAIL}`);
    return;
  }

  const token = authRes.json('access_token');
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };

  // 2. BROWSE : Récupération de la liste des stocks
  const browseRes = http.get(`${SUPABASE_URL}/rest/v1/products?select=*`, { headers: authHeaders });
  check(browseRes, {
    'browse status is 200': (r) => r.status === 200,
    'list is not empty': (r) => Array.isArray(r.json()) && r.json().length > 0,
  });

  sleep(1); // Simulation comportement humain

  // 3. SEARCH : Recherche d'un produit spécifique (ex: Sucre)
  const searchRes = http.get(`${SUPABASE_URL}/rest/v1/products?name=ilike.*sucre*&select=*`, { headers: authHeaders });
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 4. UPDATE : Mise à jour d'un stock (simulé sur le premier produit trouvé)
  const products = browseRes.json();
  if (products && products.length > 0) {
    const productId = products[0].id;
    const updatePayload = JSON.stringify({
      updated_at: new Date().toISOString(),
    });

    const updateRes = http.patch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, updatePayload, {
      headers: { ...authHeaders, 'Prefer': 'return=minimal' }
    });

    check(updateRes, {
      'update status is 204 or 200': (r) => r.status === 204 || r.status === 200,
    });
  }

  sleep(2);
}
