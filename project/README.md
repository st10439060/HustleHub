# HustleHub+

HustleHub+ is a secure freelance marketplace where clients book services from independent freelancers. This version completes the Part 2 brief: a protected Node/Express API, MongoDB persistence, and a responsive React marketplace.

## What is included

- Email/password registration and login with bcrypt password hashing and JWT sessions.
- Three roles: client, freelancer, and admin. Admin is intentionally not self-registerable.
- Freelancer service publishing with title, description, category, price, delivery time, and ownership checks.
- Public service discovery with search and category filtering.
- Client booking flow with requirements and a simulated paid transaction.
- Booking status workflow: pending, accepted, in progress, completed, and cancelled.
- Freelancer income summary showing gross earnings, platform fees, net income, and estimated tax set-aside.
- Responsive React interface with separate role-aware navigation and clear empty/error states.
- Helmet security headers, CORS, request size limits, input validation/sanitisation, safe errors, and rate limiting.
- Jest/Supertest authentication tests, Vitest/Testing Library frontend coverage, and a Newman-ready Postman collection.

## Project layout

```text
HustleHubPlus/
├── client/                 React/Vite frontend
├── src/
│   ├── controllers/        Auth and marketplace request handlers
│   ├── middleware/         JWT, RBAC, validation, and safe errors
│   ├── models/             User, Gig, Booking, Transaction
│   └── routes/             Auth, protected, and marketplace routes
├── tests/                  Jest/Supertest backend tests
├── postman/                Part 1 and Part 2 API collections
└── docs/                   Architecture and rubric evidence notes
```

## Setup

Prerequisites are Node.js 18+, MongoDB, and npm.

From the project root:

```bash
npm install
```

Create `.env` from `.env.example`, then set a MongoDB connection string and a long JWT secret. Generate local HTTPS certificates if required:

```bash
npm run certs
```

Install the frontend dependencies:

```bash
cd client
npm install
```

The backend runs on port 5000 by default. The frontend uses port 5173 by default and calls `http://localhost:5000/api`. Set `VITE_API_URL` in the client environment if the backend uses another address.

## API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a client or freelancer account |
| POST | `/api/auth/login` | Public | Sign in and receive a JWT |
| GET | `/api/auth/me` | Signed in | Read the current profile |
| GET | `/api/gigs` | Public | Browse active services |
| POST | `/api/gigs` | Freelancer | Publish a service |
| PATCH/DELETE | `/api/gigs/:id` | Owning freelancer | Edit or archive a service |
| POST | `/api/bookings` | Client | Book a service and create a simulated payment |
| GET | `/api/bookings` | Client/Freelancer | View only the user’s relevant bookings |
| PATCH | `/api/bookings/:id/status` | Booking participant | Apply an allowed status transition |
| GET | `/api/income` | Freelancer | View earnings and estimated tax |
| GET | `/api/admin/users` | Admin | View user administration data |

Every protected route requires `Authorization: Bearer <token>`. The server, not the browser, decides whether a role may perform an action or access a record.

## Run and test

Run the API from the project root:

```bash
npm run dev
```

Run the React interface from `client/`:

```bash
npm run dev
```

Run backend tests from the project root:

```bash
npm test
```

Run the frontend test from `client/`:

```bash
npm test
```

Run the API evidence collection with Newman after the backend is running:

```bash
npm run newman
```

The Part 2 collection registers demo accounts, creates a service, books it, checks the simulated transaction, verifies the freelancer view, and proves a client is blocked from creating a service.

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- JWTs expire and are verified on every protected request.
- Registration blocks self-selected admin roles.
- Gig updates and deletes are scoped to the authenticated freelancer’s own records.
- Clients cannot book their own service, and bookings are scoped by participant.
- Express Validator checks and escapes boundary input before it reaches models.
- Helmet is enabled globally, with CORS, compression, body limits, safe JSON error responses, and rate-limit headers.
- The API uses MongoDB through the backend only; the browser never connects to MongoDB directly.

## Rubric evidence

See `docs/rubric-evidence.md` for a direct map from the implementation to each marking category. Screenshots, a demonstration recording, and final GitHub history must still be captured by the student for submission.
