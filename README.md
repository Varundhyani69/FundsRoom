# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system built for a wholesale/distribution company. Handles customers, products, stock, sales challans, and basic CRM follow-ups.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js, Express.js, JavaScript     |
| Database   | MySQL                               |
| Auth       | JWT (JSON Web Tokens)               |
| Frontend   | React, JavaScript, CSS Modules      |
| Deployment | Render (backend), Vercel (frontend) |

---

## Project Structure

```
/
├── backend/          Express API server
│   ├── src/
│   │   ├── db/       DB connection, schema SQL, seed script
│   │   ├── middleware/  JWT auth, role guard, error handler
│   │   └── modules/  Feature modules (auth, customers, products, challans)
│   ├── .env.example
│   └── package.json
│
├── frontend/         React SPA
│   ├── src/
│   │   ├── api/      Axios instance with interceptors
│   │   ├── pages/    One folder per page
│   │   └── components/  Shared UI components
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8+ running locally

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd erp-crm-portal
```

### 2. Set up the database

Open MySQL and run:

```sql
source backend/src/db/schema.sql
```

Or import it via MySQL Workbench / TablePlus / DBeaver.

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT_SECRET
npm install
npm run seed     # creates test users for all 4 roles
npm run dev      # starts on http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL should point to your backend (default: http://localhost:5000)
npm install
npm run dev      # starts on http://localhost:3000
```

---

## Test Credentials

| Role      | Email                | Password       |
|-----------|----------------------|----------------|
| Admin     | admin@erp.com        | Admin@123      |
| Sales     | sales@erp.com        | Sales@123      |
| Warehouse | warehouse@erp.com    | Warehouse@123  |
| Accounts  | accounts@erp.com     | Accounts@123   |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                        |
|----------------|------------------------------------|
| PORT           | Server port (default 5000)         |
| DB_HOST        | MySQL host                         |
| DB_PORT        | MySQL port (default 3306)          |
| DB_USER        | MySQL username                     |
| DB_PASSWORD    | MySQL password                     |
| DB_NAME        | Database name                      |
| JWT_SECRET     | Secret key for signing JWTs        |
| JWT_EXPIRES_IN | Token expiry (e.g. 7d)             |
| NODE_ENV       | development / production           |

### Frontend (`frontend/.env`)

| Variable      | Description                        |
|---------------|------------------------------------|
| VITE_API_URL  | Backend API base URL               |

---

## API Overview

| Method | Endpoint              | Access       | Description              |
|--------|-----------------------|--------------|--------------------------|
| POST   | /auth/login           | Public       | Login and get JWT        |
| GET    | /auth/me              | Authenticated| Get current user info    |
| POST   | /auth/register        | Admin only   | Create a new employee    |
| GET    | /customers            | All roles    | List / search customers  |
| POST   | /customers            | Sales, Admin | Add customer             |
| PUT    | /customers/:id        | Sales, Admin | Edit customer            |
| GET    | /customers/:id        | All roles    | Customer detail          |
| POST   | /customers/:id/followups | Sales, Admin | Add follow-up note    |
| GET    | /products             | All roles    | List products            |
| POST   | /products             | Admin, Warehouse | Add product          |
| PUT    | /products/:id         | Admin, Warehouse | Edit product         |
| GET    | /stock-movements      | All roles    | Stock movement log       |
| POST   | /challans             | Sales, Admin | Create challan           |
| PUT    | /challans/:id/confirm | Sales, Admin | Confirm challan          |
| GET    | /challans             | All roles    | List challans            |

Full Postman collection is included in `/postman/erp-crm.postman_collection.json`.

---

## Architecture

```
Client (React SPA)
      │
      │  HTTP/REST (JSON)
      ▼
Express.js API Server
      │
      ├── JWT middleware (authenticate)
      ├── Role guard (authorize)
      │
      ├── /auth        → auth module
      ├── /customers   → CRM module
      ├── /products    → Inventory module
      └── /challans    → Sales module
            │
            ▼
         MySQL Database
```

- Each feature lives in its own module folder with controller + routes files.
- JWT is stateless — no session store needed.
- Stock deduction happens inside a DB transaction when a challan is confirmed.
- Challan items store a product snapshot (name, SKU, price at time of sale) so historical data stays intact even if the product is later edited.

---

## Deployment

### Backend → Render
1. Push to GitHub.
2. Create a new Web Service on Render, point to the `backend` folder.
3. Set all env variables from `.env.example` in Render dashboard.
4. Build command: `npm install` | Start command: `node src/index.js`

### Frontend → Vercel
1. Import repo on Vercel, set root directory to `frontend`.
2. Set `VITE_API_URL` to your Render backend URL.
3. Build command: `npm run build` | Output: `dist`

### Database → Neon / PlanetScale / Render Postgres
- Create a free MySQL-compatible DB, get the connection string, update backend env vars.

---

## Known Limitations

- No invoice PDF export yet (bonus feature, planned).
- No product image upload (bonus feature, planned).
- Password reset flow not implemented.
- No pagination on stock movement log (can be added if data grows).
