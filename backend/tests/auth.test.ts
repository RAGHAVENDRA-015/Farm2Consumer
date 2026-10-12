import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { env } from '../src/config/env';

describe('Auth Security & Dev Bypass Tests', () => {
  it('should block dev bypass if ENABLE_DEV_AUTH is false', async () => {
    const originalEnable = env.ENABLE_DEV_AUTH;
    (env as any).ENABLE_DEV_AUTH = false;
    try {
      // Attempt devUser query string
      const res = await request(app).get('/api/v1/cart?devUser=admin');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    } finally {
      (env as any).ENABLE_DEV_AUTH = originalEnable;
    }
  });

  it('should reject unauthenticated request without Bearer token on sync', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sync')
      .send({ name: 'Test User', role: 'ADMIN' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
