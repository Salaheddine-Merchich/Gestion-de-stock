import { test as base, request, APIRequestContext } from '@playwright/test';
import { API_CONFIG, API_HEADERS } from './api.config';

type ApiFixtures = {
  adminRequest: APIRequestContext;
  clientRequest: APIRequestContext;
  unauthRequest: APIRequestContext;
};

async function getAuthenticatedContext(email: string, password: string): Promise<APIRequestContext> {
  const authContext = await request.newContext({
    baseURL: API_CONFIG.baseUrl,
    extraHTTPHeaders: API_HEADERS,
  });

  const response = await authContext.post('/auth/v1/token?grant_type=password', {
    data: { email, password },
  });

  if (response.status() !== 200) {
    throw new Error(`Authentication failed for ${email} with status ${response.status()}`);
  }

  const authData = await response.json();
  const token = authData.access_token;

  return await request.newContext({
    baseURL: API_CONFIG.baseUrl,
    extraHTTPHeaders: {
      ...API_HEADERS,
      'Authorization': `Bearer ${token}`,
    },
  });
}

export const test = base.extend<ApiFixtures>({
  unauthRequest: async ({}, use) => {
    const context = await request.newContext({
      baseURL: API_CONFIG.baseUrl,
      extraHTTPHeaders: API_HEADERS,
    });
    await use(context);
    await context.dispose();
  },

  adminRequest: async ({}, use) => {
    const context = await getAuthenticatedContext(API_CONFIG.admin.email, API_CONFIG.admin.password);
    await use(context);
    await context.dispose();
  },

  clientRequest: async ({}, use) => {
    const context = await getAuthenticatedContext(API_CONFIG.client.email, API_CONFIG.client.password);
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
