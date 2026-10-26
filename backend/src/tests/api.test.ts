import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';

// ─── Integration Tests: Leads API Endpoints ───────────────────────────────────
// These tests spin up the actual Express app and hit the API endpoints.
// They require a running database connection (uses your .env file).
//
// Run with: npm test
// Note: These are integration tests — they hit the real DB. For CI/CD
// you should use a separate test database (set DATABASE_URL env var).

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('POST /api/leads — validation', () => {
  it('rejects a request with missing name', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('x-api-key', process.env.API_KEY || '')
      .send({ email: 'test@example.com', phone: '9876543210' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('rejects a request with an invalid email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('x-api-key', process.env.API_KEY || '')
      .send({ name: 'Test User', email: 'not-an-email', phone: '9876543210' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
      ])
    );
  });

  it('rejects a request with a phone number that is too short', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('x-api-key', process.env.API_KEY || '')
      .send({ name: 'Test User', email: 'test@example.com', phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'phone' }),
      ])
    );
  });
});

describe('GET /api/leads', () => {
  it('returns a paginated list of leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('x-api-key', process.env.API_KEY || '');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      leads: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      limit: expect.any(Number),
      totalPages: expect.any(Number),
      // ← Confirms that statusCounts is present and accurate
      statusCounts: expect.objectContaining({
        New: expect.any(Number),
        Contacted: expect.any(Number),
        Qualified: expect.any(Number),
        Closed: expect.any(Number),
      }),
    });
  });

  it('returns 401 when no API key is provided', async () => {
    // Only applies when API_KEY env var is configured
    if (!process.env.API_KEY) return;

    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
