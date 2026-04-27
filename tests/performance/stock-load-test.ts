import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Rôle : Senior Performance Engineer
 * Objectif : Valider la robustesse de l'application Cosumar sous charge.
 * 
 * Version : MOCK PERFORMANCE (TypeScript)
 */

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiKey: 'perf-test-key',
  auth: {
    email: 'admin@cosumar.test',
    password: 'Admin1234!',
  }
};

function getRandomThinkTime(min: number = 0.5, max: number = 2): number {
  return Math.random() * (max - min) + min;
}

function getHeaders(token?: string) {
  const headers: any = {
    'apikey': CONFIG.apiKey,
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export default function () {
  // 1. Auth
  const authPayload = JSON.stringify(CONFIG.auth);
  const authRes = http.post(`${CONFIG.baseUrl}/auth/v1/token`, authPayload, { headers: getHeaders() });

  check(authRes, {
    'Auth: Status 200': (r) => r.status === 200,
    'Auth: Token OK': (r) => r.json('access_token') !== undefined,
  });

  const token = authRes.json('access_token') as string;
  const headers = getHeaders(token);
  sleep(getRandomThinkTime(0.5, 1));

  // 2. Consultation
  const productsRes = http.get(`${CONFIG.baseUrl}/rest/v1/products`, { headers });
  check(productsRes, {
    'Consultation: Status 200': (r) => r.status === 200,
  });
  sleep(getRandomThinkTime(1, 2));

  // 3. Analyse
  const analysisRes = http.get(`${CONFIG.baseUrl}/rest/v1/orders`, { headers });
  check(analysisRes, {
    'Analyse: Status 200': (r) => r.status === 200,
  });
  sleep(getRandomThinkTime(1, 2));

  // 4. Action
  const updateRes = http.patch(`${CONFIG.baseUrl}/rest/v1/products?id=eq.prod-1`, JSON.stringify({ updated_at: new Date().toISOString() }), { headers });
  check(updateRes, {
    'Action: Status 204': (r) => r.status === 204 || r.status === 200,
  });
  sleep(getRandomThinkTime(1, 1.5));
}
