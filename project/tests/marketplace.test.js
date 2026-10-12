const request = require('supertest');
const { createApp } = require('../src/app');
const Gig = require('../src/models/Gig');

const app = createApp();
const password = 'Str0ng!Pass';

async function register(name, email, role) {
  const response = await request(app).post('/api/auth/register').send({ name, email, password, role });
  return response.body.token;
}

describe('Marketplace workflows and RBAC', () => {
  it('allows a freelancer to publish and a client to book a service', async () => {
    const freelancerToken = await register('Freelancer', 'freelancer@example.com', 'freelancer');
    const clientToken = await register('Client', 'client@example.com', 'client');
    const gigResponse = await request(app).post('/api/gigs').set('Authorization', `Bearer ${freelancerToken}`).send({ title: 'A thoughtful landing page', description: 'A clear and polished landing page for a growing product launch.', category: 'Design', price: 120, deliveryDays: 7 });
    expect(gigResponse.status).toBe(201);
    const bookingResponse = await request(app).post('/api/bookings').set('Authorization', `Bearer ${clientToken}`).send({ gigId: gigResponse.body.gig._id, requirements: 'Please include the supplied brand direction.' });
    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.transaction.status).toBe('paid');
  });

  it('blocks a client from freelancer-only actions', async () => {
    const clientToken = await register('Client', 'blocked@example.com', 'client');
    const response = await request(app).post('/api/gigs').set('Authorization', `Bearer ${clientToken}`).send({ title: 'Not allowed', description: 'This should be blocked by the role middleware.', category: 'Writing', price: 20, deliveryDays: 2 });
    expect(response.status).toBe(403);
  });

  it('prevents a freelancer from editing another freelancer gig', async () => {
    const firstToken = await register('First', 'first@example.com', 'freelancer');
    const secondToken = await register('Second', 'second@example.com', 'freelancer');
    const gig = await request(app).post('/api/gigs').set('Authorization', `Bearer ${firstToken}`).send({ title: 'Owned service', description: 'This service belongs to the first freelancer account.', category: 'Writing', price: 20, deliveryDays: 2 });
    const response = await request(app).patch(`/api/gigs/${gig.body.gig._id}`).set('Authorization', `Bearer ${secondToken}`).send({ title: 'Attempted takeover' });
    expect(response.status).toBe(404);
    expect(await Gig.countDocuments()).toBe(1);
  });
});
