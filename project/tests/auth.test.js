const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');

const app = createApp();

const validUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Str0ng!Pass',
  role: 'freelancer',
};

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('hashes the password before storage', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const user = await User.findOne({ email: 'jane@example.com' }).select('+password');
    expect(user.password).not.toBe('Str0ng!Pass');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'not-an-email',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'weak@example.com',
      password: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects a missing name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'noname@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'role@example.com',
      role: 'superadmin',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('defaults role to client when not specified', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Plain User',
      email: 'plain@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('client');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  it('logs in successfully and returns a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me (protected)', () => {
  it('returns the user profile with a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('jane@example.com');
  });

  it('rejects request without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Token abc');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/protected/profile', () => {
  it('allows access with a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);
    const token = reg.body.token;

    const res = await request(app).get('/api/protected/profile').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('freelancer');
  });

  it('blocks access without a token', async () => {
    const res = await request(app).get('/api/protected/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Error handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('does not expose stack traces in error responses', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(422);
    expect(JSON.stringify(res.body)).not.toContain('stack');
    expect(JSON.stringify(res.body)).not.toContain('at /');
  });
});
