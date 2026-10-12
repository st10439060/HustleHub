# HustleHub+ — Architecture Diagram (MERN)

```mermaid
graph TB
    subgraph Users["Users"]
        Client["Client User"]
        Freelancer["Freelancer User"]
        Admin["Admin User"]
    end

    subgraph Frontend["Frontend — React (Part 2)"]
        UI["React SPA<br/>Browser"]
    end

    subgraph Security["Security Boundary — HTTPS / TLS"]
        HTTPS["HTTPS Server<br/>Local SSL Certificate"]
        Helmet["Helmet Security Headers"]
        CORS["CORS Policy"]
        RateLimit["Rate Limiting"]
    end

    subgraph Backend["Backend — Node.js + Express"]
        Router["Express Router"]
        AuthMW["JWT Auth Middleware"]
        RoleMW["Role Authorization Middleware"]
        Validator["Input Validation & Sanitisation<br/>express-validator"]
        AuthCtrl["Auth Controller<br/>Register / Login / Me"]
        ProtectedCtrl["Protected Route Controller"]
        ErrorHandler["Central Error Handler<br/>Safe JSON responses"]
        Logger["Winston Logger<br/>Security Event Logging"]
    end

    subgraph Data["Data Layer — MongoDB"]
        DB[("MongoDB<br/>users collection")]
    end

    subgraph External["External / DevSecOps (Part 3)"]
        Docker["Docker Containers"]
        CICD["CI/CD Pipeline<br/>GitHub Actions"]
        Tests["Automated Tests<br/>Unit + API"]
        Scans["Security Scans"]
    end

    Client -->|HTTPS request| UI
    Freelancer -->|HTTPS request| UI
    Admin -->|HTTPS request| UI
    UI -->|JWT-protected API calls| HTTPS

    HTTPS --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> Router

    Router -->|/api/auth/*| Validator
    Router -->|/api/protected/*| AuthMW
    AuthMW --> RoleMW
    RoleMW --> ProtectedCtrl

    Validator --> AuthCtrl
    AuthCtrl -->|hash password| DB
    AuthCtrl -->|verify password| DB
    AuthCtrl -->|sign JWT| AuthMW
    ProtectedCtrl -->|fetch user| DB

    Router --> ErrorHandler
    ErrorHandler --> Logger
    AuthCtrl --> Logger
    AuthMW --> Logger

    style Security fill:#1a3a5c,stroke:#3b82f6,color:#fff
    style Backend fill:#1a2a1a,stroke:#22c55e,color:#fff
    style Data fill:#3a2a1a,stroke:#f59e0b,color:#fff
    style Frontend fill:#2a1a3a,stroke:#a855f7,color:#fff
    style External fill:#3a1a1a,stroke:#ef4444,color:#fff
    style Users fill:#1a1a2a,stroke:#64748b,color:#fff
```

## System Boundaries

| Boundary | Description |
|---|---|
| **HTTPS / TLS** | All traffic between the browser and the server is encrypted using a locally configured SSL certificate. This protects credentials and JWTs in transit. |
| **Security Headers** | Helmet sets HTTP headers that prevent clickjacking, MIME sniffing, and other common attacks. |
| **Rate Limiting** | Limits the number of requests per IP window to prevent brute-force and abuse. |
| **JWT Authentication** | Protected routes require a valid Bearer token. The token is verified on every request. |
| **Role Authorization** | Admin-only routes are gated by role-based middleware. |
| **Input Validation** | All user input is validated and sanitised before processing. |
| **Error Handling** | Errors are caught centrally and returned as safe JSON. Stack traces, file paths, and configuration are never exposed. |
| **MongoDB** | The database is accessed only through the backend API. No direct client-to-database access exists. |

## Request Flow

```
User → Browser (React SPA) → HTTPS → Helmet → CORS → Rate Limit → Express Router
  → Validation → Controller → MongoDB → Response → Error Handler (if needed) → User
```

## Technology Stack (MERN)

| Layer | Technology |
|---|---|
| Database | MongoDB |
| Backend | Node.js, Express |
| Frontend | React (added in Part 2) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Security | Helmet, CORS, Rate Limiting, express-validator |
| Logging | Winston |
| Testing | Jest, Supertest (Part 3) |
| DevOps | Docker, GitHub Actions (Part 3) |
