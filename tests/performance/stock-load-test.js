import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Rôle : Senior Performance Engineer
 * Objectif : STRESS TEST COSUMAR (300 VUs)
 */

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp-up: 0 à 100 VUs
    { duration: '5m', target: 100 },  // Sustain: Maintenir 100 VUs
    { duration: '30s', target: 300 }, // Stress: Pic brutal à 300 VUs
    { duration: '1m', target: 0 },    // Cooldown
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiKey: 'perf-test-key',
  auth: { email: 'admin@cosumar.test', password: 'Admin1234!' }
};

function getRandomThinkTime(min, max) {
  min = min || 0.5;
  max = max || 2;
  return Math.random() * (max - min) + min;
}

export default function () {
  const headers = { 'apikey': CONFIG.apiKey, 'Content-Type': 'application/json' };

  // 1. Auth
  const authRes = http.post(`${CONFIG.baseUrl}/auth/v1/token`, JSON.stringify(CONFIG.auth), { headers });
  const token = authRes.json('access_token');
  const authHeaders = { ...headers, 'Authorization': `Bearer ${token}` };
  sleep(getRandomThinkTime(0.5, 1));

  // 2. Consultation
  const productsRes = http.get(`${CONFIG.baseUrl}/rest/v1/products`, { headers: authHeaders });
  check(productsRes, { 'Status 200': (r) => r.status === 200 });
  sleep(getRandomThinkTime(1, 2));

  // 3. Analyse
  const analysisRes = http.get(`${CONFIG.baseUrl}/rest/v1/orders`, { headers: authHeaders });
  check(analysisRes, { 'Analyse OK': (r) => r.status === 200 });
  sleep(getRandomThinkTime(1, 2));

  // 4. Action
  const updateRes = http.patch(`${CONFIG.baseUrl}/rest/v1/products?id=eq.prod-1`, JSON.stringify({ updated_at: new Date().toISOString() }), { headers: authHeaders });
  check(updateRes, { 'Update OK': (r) => r.status === 204 || r.status === 200 });
  
  sleep(getRandomThinkTime(1, 1.5));
}
