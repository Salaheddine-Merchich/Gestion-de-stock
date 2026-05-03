import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load test environment variables
dotenvConfig({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenvConfig({ path: path.resolve(process.cwd(), '.env.test'), override: true });

export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
  supabaseKey: 'mock-anon-key',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@cosumar.test',
    password: process.env.ADMIN_PASSWORD || 'Admin1234!',
  },
  client: {
    email: process.env.CLIENT_EMAIL || 'client@cosumar.test',
    password: process.env.CLIENT_PASSWORD || 'Client1234!',
  },
};

export const API_HEADERS = {
  'apikey': API_CONFIG.supabaseKey,
  'Content-Type': 'application/json',
};
