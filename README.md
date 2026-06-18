# V-Legal — Setup & Deployment Guide

## Quick Start (Run in your terminal)

```bash
cd "d:\WorkingFolder\OneDrive - vikramsolar.com\Desktop\V-Legal\v-legal"

# 1. Install dotenv for Prisma config (needed for Prisma v7)
npm install dotenv

# 2. Set up your .env file with your Neon DB URL
# Edit .env and replace the DATABASE_URL with your actual Neon connection string

# 3. Push schema to database
npx prisma db push

# 4. Create the initial Super Admin
# After the app starts, call: POST http://localhost:3000/api/seed
# Body: { "adminEmail": "admin@vikramsolar.com", "adminPassword": "Admin@123" }

# 5. Start development server
npm run dev
```

---

## Step-by-Step Setup

### 1. Get Your Neon Database URL

1. Go to [neon.tech](https://neon.tech) → Create free account
2. Create a new project → `v-legal`
3. Copy the **Connection String** (looks like `postgresql://...@...neon.tech/neondb?sslmode=require`)

### 2. Configure Environment Variables

Edit `.env` in the project root:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="any-random-32-char-string-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push Database Schema

```bash
npx prisma db push
```

This creates all tables in Neon automatically.

### 4. Start the App

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Create Initial Admin User

Open a terminal/Postman and run:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"adminEmail":"admin@vikramsolar.com","adminPassword":"Admin@123","adminName":"Super Admin"}'
```

Or visit `http://localhost:3000/api/seed` with a POST request.

### 6. Login

Go to `http://localhost:3000/login`  
Email: `admin@vikramsolar.com`  
Password: `Admin@123`

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial V-Legal commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import from GitHub
2. Select the `v-legal` repository
3. Framework: **Next.js** (auto-detected)
4. Set Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `AUTH_SECRET` = your secret (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`

### 3. After Deployment

Visit `https://your-app.vercel.app/api/seed` with POST to create admin user.

---

## Roles & Permissions

| Role | Can Create/Edit | Can Delete | Admin Panel | Finance |
|------|----------------|------------|-------------|---------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ❌ | ❌ | ✅ |
| Legal Team | ✅ (matters/hearings) | ❌ | ❌ | ❌ |
| Finance | ✅ (invoices) | ❌ | ❌ | ✅ |
| Viewer | ❌ | ❌ | ❌ | ❌ |

---

## File Structure

```
v-legal/
├── prisma/
│   └── schema.prisma          # Full DB schema
├── prisma.config.ts           # Prisma v7 config
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated pages group
│   │   │   ├── layout.tsx     # Sidebar + Topbar layout
│   │   │   ├── dashboard/     # Dashboard with KPIs + charts
│   │   │   ├── matters/       # Legal matters CRUD
│   │   │   ├── hearings/      # Hearing records
│   │   │   ├── invoices/      # Invoice tracking
│   │   │   ├── documents/     # Document repository
│   │   │   ├── notices/       # Legal notices
│   │   │   └── admin/         # User management + audit
│   │   ├── api/               # Route handlers
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── matters/       # CRUD + [id]
│   │   │   ├── hearings/      # CRUD + [id]
│   │   │   ├── invoices/      # CRUD + [id]
│   │   │   ├── documents/     # CRUD + [id]
│   │   │   ├── notices/       # CRUD + [id]
│   │   │   ├── users/         # User management
│   │   │   ├── dashboard/     # Aggregated stats
│   │   │   ├── audit/         # Audit logs
│   │   │   └── seed/          # Initial admin setup
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Redirect handler
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Dark collapsible sidebar
│   │   │   └── Topbar.tsx     # White topbar
│   │   └── ui/
│   │       ├── Modal.tsx      # Animated modal
│   │       ├── KPICard.tsx    # Dashboard KPI cards
│   │       ├── StatusPill.tsx # All status pills
│   │       └── index.tsx      # Card, Button, EmptyState etc.
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── audit.ts           # Audit logging
│   │   ├── prisma.ts          # DB client
│   │   ├── rbac.ts            # Role permissions
│   │   ├── utils.ts           # formatDate, currency etc.
│   │   └── validations.ts     # All Zod schemas
│   ├── middleware.ts           # Auth guard
│   └── types/
│       └── next-auth.d.ts     # Session type extensions
├── .env                       # Local env (not committed)
├── .env.example               # Template
└── next.config.ts
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth.js v5 with bcrypt
- **Database**: Neon PostgreSQL via Prisma v7
- **UI**: Tailwind CSS + Framer Motion + Lucide + Recharts
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (30s auto-refresh = live-ish sync)
- **Toasts**: Sonner

## Theme

- Primary: `#D92228` (Vikram Solar Red)
- Secondary: `#1A1D2E` (Dark Navy)  
- Accent: `#F5A623` (Solar Gold)
- Background: `#F8F9FC`
