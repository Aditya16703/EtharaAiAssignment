 FlowDesk

FlowDesk is a production-grade project management application inspired by Linear. It provides a sleek, high-performance interface for teams to manage workspaces, track issues, and collaborate in real-time.

![FlowDesk Preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070)

## 🚀 Key Features

- **Premium Auth Flow**: Cinematic split-screen Login/Register experience with glassmorphism and secure JWT session handling.
- **Workspace Management**: Create and manage multiple organizations with unique slugs (e.g., `flowdesk.app/acme`).
- **Team Management**: Robust Role-Based Access Control (RBAC). Invite members, manage roles (Admin/Member), and secure workspace access.
- **Kanban & Issue Tracking**: Create, assign, and track tasks with status updates, priorities, and due dates.
- **Real-time Dashboard**: Visual summaries of project health, including issue distribution and overdue tasks.
- **Industry-Level Security**: 
  - Bcrypt password hashing (Cost 12)
  - JWT Refresh Token Rotation
  - HttpOnly Secure Cookies
  - Global & Auth Rate Limiting

## 🛠️ Technology Stack

### Frontend
- **React 18** + **Vite** (Next-gen build tool)
- **Tailwind CSS** (Utility-first styling)
- **TanStack Query** (Server state management)
- **Zustand** (Global client state)
- **Lucide React** (Premium iconography)

### Backend
- **Node.js** + **Express** (TypeScript-first)
- **Prisma ORM** (Type-safe database access)
- **PostgreSQL** (Production-ready relational DB)
- **Zod** (Schema-first validation)

---

## 💻 Local Development

### 1. Prerequisites
- Node.js (v18+)
- A PostgreSQL instance (Supabase or local)

### 2. Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/Aditya16703/EtharaAiAssignment.git
cd EtharaAiAssignment
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_direct_postgresql_url"
JWT_ACCESS_SECRET="your_long_secret"
JWT_REFRESH_SECRET="your_longer_secret"
PORT=3000
NODE_ENV=development
```

### 4. Database Initialization
```bash
cd backend
npx prisma db push
```

### 5. Start Development Server
From the project root:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 🌐 Production Deployment

### Backend (Render)
1. Create a **Web Service** on [Render.com](https://render.com).
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/index.js`
5. Add your `.env` variables in the Render dashboard.

### Frontend (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable: `VITE_API_URL` = Your Render Backend URL.
4. Deploy!

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
