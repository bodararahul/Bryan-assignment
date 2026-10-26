import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Authentication & Customer Isolation API', () => {
  let adminToken = '';
  let newTenantToken = '';
  const testEmail = `user_${Date.now()}@testcompany.com`;

  it('rejects login with missing email or password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadmanager.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadmanager.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('successfully logs in with admin credentials and returns tenant info', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadmanager.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: 'admin@leadmanager.com',
      role: 'admin',
      tenantId: 'tenant_default',
    });

    adminToken = res.body.token;
  });

  it('rejects registration when password lacks complexity', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bryan Reviewer',
        email: `invalid_${Date.now()}@company.com`,
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects registration when password and confirmPassword mismatch', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bryan Reviewer',
        email: `mismatch_${Date.now()}@company.com`,
        password: 'SecurePass@123',
        confirmPassword: 'DifferentPass@123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.message).toContain('do not match');
  });

  it('registers a new user with an isolated tenant organization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bryan Reviewer',
        orgName: 'Reviewer Enterprise',
        email: testEmail,
        password: 'SecurePass@123',
        confirmPassword: 'SecurePass@123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: testEmail,
      name: 'Bryan Reviewer',
      orgName: 'Reviewer Enterprise',
    });
    expect(res.body.user.tenantId).toBeDefined();
    expect(res.body.user.tenantId).not.toBe('tenant_default');

    newTenantToken = res.body.token;
  });

  it('rejects duplicate email registration (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Bryan',
        orgName: 'Another Org',
        email: testEmail,
        password: 'SecurePass@123',
        confirmPassword: 'SecurePass@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('successfully logs in with the newly registered user credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'SecurePass@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);
  });

  it('enforces customer data isolation: new tenant only sees their own leads', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${newTenantToken}`);

    expect(res.status).toBe(200);
    // All leads returned to this user must belong to their tenant
    expect(Array.isArray(res.body.data.leads)).toBe(true);
    for (const lead of res.body.data.leads) {
      if (lead.tenant_id) {
        expect(lead.tenant_id).not.toBe('tenant_default');
      }
    }
  });

  it('blocks access to protected /api/leads without authentication (401)', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
