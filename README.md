# SmartQueue - Real-time Queue & Token Management System

A full-stack, enterprise-grade Token and Queue Management System with real-time updates via Socket.IO, secure JWT authentication, role-based access control (Admin & Counter Staff), interactive analytics, and multi-counter service workflows.

## 🚀 Key Features

- **Real-Time Token Display & Tracking**: Live WebSocket synchronization between customer screens, counter dashboards, and the public queue display board.
- **Role-Based Access Control**:
  - **Customer Portal**: Generate service tokens, track wait time, and view current position in real time.
  - **Staff / Counter Operator**: Call next token, recall, mark completed, skip/no-show, and manage counter status.
  - **Admin Dashboard**: Manage departments, counters, users, real-time analytics, and operational metrics.
- **Enterprise Security**:
  - Bcrypt password hashing
  - Secure JWT authentication & authorization
  - In-memory rate limiting on authentication and token generation
  - Strict CORS origin whitelisting
  - Atomic token sequence generation preventing duplicates and race conditions
- **Modern Responsive UI**: Crafted with React, Vite, and responsive CSS with dark/light visual excellence.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router, Socket.IO Client, Lucide React
- **Backend**: Node.js, Express, MongoDB with Mongoose, Socket.IO, JSON Web Tokens, bcryptjs
- **Database**: MongoDB

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Socket.IO, and server configurations
│   │   ├── controllers/     # Route business logic (auth, tokens, counters, stats)
│   │   ├── middleware/      # Auth, rate limiting, validation, error handler
│   │   ├── models/          # Mongoose models (User, Token, Counter, Department)
│   │   ├── routes/          # Express API route endpoints
│   │   ├── seeds/           # Seed scripts with demo data
│   │   ├── utils/           # Token generation, helpers, testing utilities
│   │   └── app.js           # Express app setup and middleware
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components & layouts
│   │   ├── context/         # Auth and Socket.IO state contexts
│   │   ├── pages/           # Customer, Staff, Admin, and Display pages
│   │   ├── services/        # API client and WebSocket handlers
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package.json
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or on MongoDB Atlas

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone git@github.com:iamabhi005/Queue-Token-Management-System.git
cd Queue-Token-Management-System

# Install root, backend, and frontend dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/smartqueue_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### 3. Seed Demo Data (Optional)

```bash
cd backend
npm run seed
```

### 4. Run the Application

You can run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

Or run them individually:

```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)

---

## 📄 License

MIT
