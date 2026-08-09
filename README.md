# Mini ERP + CRM Operations Portal

A full-stack internal operations portal built for a wholesale/distribution company. Covers customer CRM, product inventory, stock tracking, and sales challan management.

---

Live Link: https://fundsroom-dos3.onrender.com

## Test Credentials

| Role      | Email                | Password       |
|-----------|----------------------|----------------|
| Admin     | admin@erp.com        | Admin@123      |
| Sales     | sales@erp.com        | Sales@123      |
| Warehouse | warehouse@erp.com    | Warehouse@123  |
| Accounts  | accounts@erp.com     | Accounts@123   |

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Node.js 22, Express.js, TypeScript      |
| Database   | MySQL 8                                 |
| Auth       | JWT (JSON Web Tokens), bcryptjs         |
| Frontend   | React 18, JavaScript, CSS Modules       |
| Bundler    | Vite 8                                  |
| Containers | Docker + Docker Compose                 |
| Deployment | AWS EC2 + Docker (backend) · Render Static Site (frontend) |

---

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js       MySQL connection pool
│   │   │   ├── schema.sql          Full DB schema (all tables)
│   │   │   ├── migrate.js          Run schema via Node.js
│   │   │   └── seed.js             Seed test data + users
│   │   ├── middleware/
│   │   │   ├── authenticate.js     JWT verification
│   │   │   ├── authorize.js        Role-based access guard
│   │   │   └── errorHandler.js     Global error handler
│   │   ├── modules/
│   │   │   ├── auth/               Login, register, get me
│   │   │   ├── customers/          CRM - CRUD, follow-ups
│   │   │   ├── products/           Inventory - CRUD, stock adjust
│   │   │   ├── challans/           Sales challans with stock logic
│   │   │   └── dashboard/          Aggregated stats API
│   │   ├── app.js                  Express app setup
│   │   └── index.js                Server entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                    Axios wrappers per module
│   │   ├── components/             Layout, Sidebar, Badge, ProtectedRoute
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── customers/          List, Form, Detail
│   │       ├── products/           List, Form, Detail, StockMovements
│   │       └── challans/           List, Create, Detail
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── postman/
│   └── erp-crm.postman_collection.json
├── docker-compose.yml
└── README.md
```

---

## Local Setup (without Docker)

### Prerequisites
- Node.js v18+
- MySQL 8 running locally

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd erp-crm-portal
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in your MySQL credentials
npm install
node src/db/migrate.js   # creates DB + all tables
npm run seed             # seeds test users + mock data
npm run dev              # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm install
npm run dev              # starts on http://localhost:3000
```

---

## Local Setup (with Docker)

Requires Docker Desktop installed and running.

```bash
# From repo root
docker-compose up --build
```

This starts:
- MySQL on port 3307
- Backend API on port 5000
- Frontend on port 3000

Then seed the data:

```bash
docker exec erp_backend node src/db/seed.js
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                          | Default       |
|-----------------|--------------------------------------|---------------|
| PORT            | Server port                          | 5000          |
| DB_HOST         | MySQL host                           | localhost     |
| DB_PORT         | MySQL port                           | 3306          |
| DB_USER         | MySQL username                       | root          |
| DB_PASSWORD     | MySQL password                       | —             |
| DB_NAME         | Database name                        | erp_crm_db    |
| JWT_SECRET      | Secret key for signing JWTs          | —             |
| JWT_EXPIRES_IN  | Token expiry duration                | 7d            |
| NODE_ENV        | Environment                          | development   |

### Frontend (`frontend/.env`)

| Variable       | Description                           |
|----------------|---------------------------------------|
| VITE_API_URL   | Backend base URL                      |

---

## API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint          | Access       | Description              |
|--------|-------------------|--------------|--------------------------|
| POST   | /auth/login       | Public       | Login, returns JWT       |
| GET    | /auth/me          | All          | Current user info        |
| POST   | /auth/register    | Admin        | Create new employee      |

### Dashboard
| Method | Endpoint             | Access | Description               |
|--------|----------------------|--------|---------------------------|
| GET    | /dashboard/stats     | All    | Aggregated system stats   |

### Customers
| Method | Endpoint                    | Access        | Description             |
|--------|-----------------------------|---------------|-------------------------|
| GET    | /customers                  | All           | List with search/filter |
| GET    | /customers/:id              | All           | Customer detail         |
| POST   | /customers                  | Admin, Sales  | Create customer         |
| PUT    | /customers/:id              | Admin, Sales  | Update customer         |
| POST   | /customers/:id/followups    | Admin, Sales  | Add follow-up note      |

### Products
| Method | Endpoint                        | Access            | Description           |
|--------|---------------------------------|-------------------|-----------------------|
| GET    | /products                       | All               | List with filters     |
| GET    | /products/:id                   | All               | Product + movements   |
| POST   | /products                       | Admin, Warehouse  | Create product        |
| PUT    | /products/:id                   | Admin, Warehouse  | Update product        |
| POST   | /products/:id/stock-adjust      | Admin, Warehouse  | Manual stock IN/OUT   |
| GET    | /stock-movements                | All               | Full movement log     |

### Challans
| Method | Endpoint                | Access       | Description                     |
|--------|-------------------------|--------------|----------------------------------|
| GET    | /challans               | All          | List with filters                |
| GET    | /challans/:id           | All          | Challan detail with line items   |
| POST   | /challans               | Admin, Sales | Create draft or confirmed        |
| PUT    | /challans/:id/confirm   | Admin, Sales | Confirm draft — deducts stock    |
| PUT    | /challans/:id/cancel    | Admin, Sales | Cancel — restores stock if needed|

---

## Architecture

```
React SPA (Vite)
     │
     │  REST / JSON over HTTP
     ▼
Express.js API
     │
     ├── authenticate middleware  (JWT verification)
     ├── authorize middleware     (role guard)
     │
     ├── /auth          → auth module
     ├── /dashboard     → stats module
     ├── /customers     → CRM module
     ├── /products      → inventory module
     ├── /stock-movements
     └── /challans      → sales module
               │
               ▼
          MySQL 8 Database
```

Key design decisions:
- JWT is stateless — no session store
- Challan confirmation runs inside a DB transaction — all stock checks happen before any deduction, so it either fully succeeds or fully fails
- Challan line items store a product snapshot (name, SKU, price at time of sale) so historical records stay accurate even when products are edited later
- Cancelling a confirmed challan automatically reverses all stock movements
- Each module follows a controller + routes separation for clarity

---

## Deployment

### Current Setup
| Layer | Platform |
|-------|----------|
| Frontend | Render Static Site |
| Backend + MySQL | AWS EC2 (Docker Compose) |

### Backend on AWS EC2 (Docker)

Prerequisites: EC2 instance (Ubuntu 22.04), Docker installed, ports 80/443/5000 open.

```bash
# Clone repo on EC2
git clone <repo-url>
cd <repo>

# Create env file
cp .env.prod.example .env.prod
nano .env.prod   # fill in DB passwords, JWT secret, CORS_ORIGIN

# Start MySQL + backend containers
docker compose -f docker-compose.server.yml --env-file .env.prod up -d --build

# Seed database (run once)
docker exec erp_backend node src/db/seed.js
```

Backend runs on port 5000. Caddy is used as a reverse proxy to provide HTTPS via `https://<ec2-ip>.nip.io`.

### Frontend on Render Static Site

1. Connect GitHub repo on [render.com](https://render.com)
2. New → Static Site → select repo
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variable: `VITE_API_URL=https://<ec2-ip>.nip.io`
7. Deploy

### Redeploy after code changes

**Backend:**
```bash
git pull
docker compose -f docker-compose.server.yml --env-file .env.prod up -d --build
```

**Frontend:** push to GitHub — Render auto-deploys.

---

## Postman Collection

Import `postman/erp-crm.postman_collection.json` into Postman.

The Login request auto-saves the JWT token to a collection variable, so all subsequent requests are authenticated automatically.

---

## Bonus Features Implemented

- Docker + Docker Compose setup for one-command local dev
- Browser print support on challan detail page
- Low stock alert on dashboard and product list
- Upcoming follow-ups widget on dashboard
- Stock cancellation reversal (confirmed challan cancel restores stock)

---

## Known Limitations & Assumptions

### JavaScript instead of TypeScript
The backend was initially prototyped in JavaScript to move fast during development, then fully migrated to TypeScript before submission. All source files in `backend/src` are `.ts` with strict mode enabled, proper typing on all request/response handlers, shared types in `src/types/index.ts`, and the project compiles cleanly with `tsc` with zero errors.

### PDF export not implemented
Invoice/challan export as PDF is listed as a bonus feature. The challan detail page includes a fully functional browser print view (Ctrl+P or the Print button) which produces a clean printable layout with proper CSS print styles. A proper server-generated PDF using pdfkit or puppeteer was not implemented within the time available but the endpoint structure (`GET /challans/:id/pdf`) is straightforward to add on top of the existing challan detail API.

### Product image upload not implemented
AWS S3 image upload for products is a bonus feature that was not implemented. The product schema and API are ready to accept an `image_url` field — the missing piece is the S3 upload middleware (multer + aws-sdk), which can be added without changing any existing logic.

### GitHub Actions CI/CD not set up
Automated deployment via GitHub Actions is a bonus feature. Deployment is currently done manually via `git pull` + `docker compose up` on EC2, which is reliable and straightforward for a project of this size. A Actions workflow for auto-deploy on push to main would be the natural next step.

### No password reset flow
Users cannot reset their own passwords. An admin can create new accounts via `POST /auth/register`. This was a deliberate scope decision — the system is used by internal employees whose accounts are managed by the admin.

### Dashboard widgets not paginated
The recent challans, low stock, and upcoming follow-ups widgets on the dashboard are intentionally limited to 5-8 records each. Full pagination on widgets would add complexity without meaningful value for an internal operations dashboard where users can navigate to the dedicated list pages for complete data.
