# SmartQueue – Backend REST API

Production-ready Backend API for **SmartQueue – Queue Token Management System** built with Node.js, Express.js, MongoDB, and Mongoose.

---

## 1. Quick Start

### Prerequisites
* **Node.js**: v18+ (verified on v24)
* **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Installation & Environment Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env from template
cp .env.example .env
```

### Seed Default Database Records
Populates core services, counters, and admin/staff user accounts:
```bash
npm run seed
# or from project root:
npm run seed:backend
```

**Default Seed Credentials:**
* **Admin Account:** `admin@smartqueue.com` / `admin123` (Role: `ADMIN`)
* **Staff Account:** `staff@smartqueue.com` / `staff123` (Role: `STAFF`)

### Start the Server
```bash
# Development mode with nodemon:
npm run dev

# Production mode:
npm start

# From workspace root:
npm run dev:backend
```

Server runs on: **`http://localhost:5001`**  
Health Check: **`http://localhost:5001/api/health`**

### Run Automated API Test Suite
```bash
node src/utils/testEndpoints.js
# or from root:
npm run test:backend
```
Verifies all 20 test cases including auth, role restrictions, CRUD, and concurrency safety.

---

## 2. Environment Variables (`.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP Server Port | `5001` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb://127.0.0.1:27017/smartqueue_db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `smartqueue_dev_jwt_secret_key_2026` |
| `JWT_EXPIRES_IN` | Token duration | `24h` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

---

## 3. Mongoose Schemas

### `User`
* `name`: String (Required)
* `email`: String (Required, Unique, Lowercase)
* `passwordHash`: String (Bcrypt hash)
* `role`: String (`'ADMIN'`, `'STAFF'`, `'CUSTOMER'`)
* `createdAt`: Date

### `Service`
* `name`: String (Required, Unique)
* `description`: String
* `isActive`: Boolean (Default: `true`)
* `averageServiceTime`: Number (Minutes, Min: 1)

### `Counter`
* `name`: String (Required, Unique)
* `serviceId`: ObjectId (Ref: `Service`)
* `isActive`: Boolean (Default: `true`)

### `Token`
* `tokenNumber`: String (Indexed)
* `customerName`: String (Required)
* `serviceId`: ObjectId (Ref: `Service`)
* `counterId`: ObjectId (Ref: `Counter`, Default: `null`)
* `status`: String (`'WAITING'`, `'SERVING'`, `'COMPLETED'`, `'SKIPPED'`)
* `createdAt`: Date
* `calledAt`: Date
* `completedAt`: Date

### `TokenSequence` (Concurrency Guarantee)
* `serviceId`: ObjectId (Ref: `Service`)
* `dateCode`: String (`YYYY-MM-DD`)
* `sequence`: Number
* **Compound Unique Index:** `{ serviceId: 1, dateCode: 1 }`

---

## 4. REST API Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register user (`name, email, password, role`)
* `POST /api/auth/login` — Sign in with credentials, returns signed JWT token

### Customer Token Operations (`/api/tokens`)
* `POST /api/tokens` — Issue token (`customerName, serviceId`)
* `GET /api/tokens/:id` — Get token details with populated service & counter
* `GET /api/tokens/status/:id` — Live status, queue position ahead & estimated wait time

### Administrative Queue Controls (`/api/admin`) *(Requires Bearer JWT)*
* `GET /api/admin/tokens` — List tokens (Filters: `status, serviceId, counterId, date, search`, Pagination: `page, limit`)
* `GET /api/admin/stats` — Real-time operational queue KPIs
* `POST /api/admin/tokens/next` — Call next waiting customer for counter (`counterId`)
* `PATCH /api/admin/tokens/:id/complete` — Mark token completed
* `PATCH /api/admin/tokens/:id/skip` — Mark token skipped (no-show)

### Services & Counters (`/api/services`, `/api/admin`)
* `GET /api/services` — Public list of active services
* `POST /api/admin/services` — Admin create service category (`ADMIN` only)
* `GET /api/admin/counters` — List all counters with service details
* `POST /api/admin/counters` — Admin create physical counter station (`ADMIN` only)

---

## 5. Security & Concurrency Design

1. **Atomic Concurrency Protection (Zero Duplicate Tokens):**  
   Token numbers are generated using MongoDB's atomic `findOneAndUpdate` with `$inc` on the `TokenSequence` collection scoped by `{ serviceId, dateCode: 'YYYY-MM-DD' }`. Even under massive parallel bursts, MongoDB's document-level write lock ensures each request receives an incremental sequence number with 0 collision risk.
2. **Role-Based Access Control (RBAC):**  
   Users with role `CUSTOMER` are strictly rejected with HTTP `403 Forbidden` from accessing any `/api/admin/*` endpoints.
3. **Password Security:**  
   Bcrypt with 12 salt rounds; `passwordHash` is automatically stripped from JSON outputs.
4. **Resilient Error Normalization:**  
   Invalid MongoDB ObjectIds (`CastError`), schema validation failures, and duplicate keys (`E11000`) are captured by centralized middleware and returned as clean `400 Bad Request` or `409 Conflict` JSON responses.
