<<<<<<< HEAD
# ⛳ GolfGive — Golf Charity Subscription Platform

**Play. Win. Give.**  
A full-stack MERN subscription platform combining golf performance tracking, monthly prize draws, and charitable giving.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Stripe account (for payments)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd golf-charity

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your values (see below)
```

**Required `.env` values:**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/golf-charity
JWT_SECRET=your_random_secret_string_min_32_chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
CLIENT_URL=http://localhost:3000
```

### 3. Configure Frontend Environment
```bash
cd frontend
# Create .env
echo "REACT_APP_API_URL=/api" > .env
```

### 4. Seed Database with Demo Data
```bash
cd backend
node scripts/seed.js
```

This creates:
- 👤 Admin: `admin@golfgive.com` / `admin1234`
- 🏌️ Player: `player@demo.com` / `demo1234`
- 6 featured charities
- 10 active subscribers with scores
- 1 published March 2026 draw with winners

### 5. Run Development Servers
```bash
# From project root — runs both backend (port 5000) and frontend (port 3000)
npm run dev
```

Or run separately:
```bash
npm run dev:backend   # Backend on :5000
npm run dev:frontend  # Frontend on :3000
```

---

## 🏗 Project Structure

```
golf-charity/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (auth, subscription, charity, winnings)
│   │   ├── Score.js         # Stableford score management (max 5 rolling)
│   │   ├── Charity.js       # Charity directory with events
│   │   └── Draw.js          # Monthly draw with prize pools and winners
│   ├── routes/
│   │   ├── auth.js          # Register / Login / Me
│   │   ├── users.js         # Profile, charity, winnings
│   │   ├── scores.js        # CRUD score entries
│   │   ├── draws.js         # Draw logic, simulation, publish
│   │   ├── charities.js     # Charity directory + user selection
│   │   ├── payments.js      # Stripe checkout + webhook handler
│   │   └── admin.js         # Admin management endpoints
│   ├── middleware/
│   │   └── auth.js          # JWT protect, adminOnly, subscriberOnly, generateToken
│   ├── scripts/
│   │   └── seed.js          # Demo data seeder
│   ├── server.js            # Express app entry point
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── context/
│       │   └── AuthContext.js    # Global auth state (login, register, logout, refresh)
│       ├── utils/
│       │   └── api.js            # Axios instance with interceptors
│       ├── components/
│       │   └── layout/
│       │       ├── Navbar.js / .css
│       │       └── Footer.js / .css
│       ├── pages/
│       │   ├── HomePage.js / .css       # Landing page with hero, steps, prizes, charities
│       │   ├── LoginPage.js             # Auth with demo buttons
│       │   ├── RegisterPage.js          # 2-step registration with charity selection
│       │   ├── AuthPages.css            # Shared auth styles
│       │   ├── SubscribePage.js / .css  # Pricing + FAQ
│       │   ├── DashboardPage.js / .css  # User dashboard (5 tabs)
│       │   ├── CharitiesPage.js / .css  # Browse + filter charities
│       │   ├── CharityDetailPage.js     # Individual charity + events
│       │   ├── DrawsPage.js / .css      # Current draw + history
│       │   └── AdminPage.js / .css      # Full admin dashboard (6 tabs)
│       ├── App.js                       # Router + auth protection
│       ├── index.js
│       └── index.css                    # Design system (variables, components)
│
├── vercel.json
├── package.json                         # Root scripts
└── README.md
```

---

## 🎯 Feature Checklist

### User Features
- [x] Register (2-step with charity selection)
- [x] Login / Logout with JWT auth
- [x] Subscribe — Monthly (£9.99) or Yearly (£89.99)
- [x] Stripe Checkout integration + webhook
- [x] Dashboard with 5 tabs: Overview, Scores, Draw Results, Charity, Winnings
- [x] Score management: Add, Edit, Delete — rolling 5-score system (1–45 Stableford)
- [x] Charity selection + contribution % (min 10%, adjustable)
- [x] Draw results vs own scores
- [x] Winnings history + payout status
- [x] Proof upload URL submission for winner verification

### Admin Features
- [x] Platform stats overview
- [x] User management: search, filter, activate/cancel subscriptions
- [x] Draw engine: configure month/year/type (random or algorithmic)
- [x] Simulation mode before publishing
- [x] Publish draw + auto-assign winners + jackpot rollover
- [x] Charity management: create, feature toggle, deactivate
- [x] Winner verification: approve / reject / mark as paid
- [x] Reports & analytics dashboard

### Public Features
- [x] Homepage with hero, how-it-works, prize structure, charity preview
- [x] Browse charities with search + category filter
- [x] Individual charity profiles with events
- [x] Draws page showing current draw + history

---

## 💳 Stripe Setup

1. Create two Products in Stripe Dashboard:
   - **Monthly Plan**: £9.99/month recurring
   - **Yearly Plan**: £89.99/year recurring

2. Copy the Price IDs into `.env`:
   ```
   STRIPE_MONTHLY_PRICE_ID=price_xxx
   STRIPE_YEARLY_PRICE_ID=price_yyy
   ```

3. Set up a webhook pointing to `https://your-api.com/api/payments/webhook`  
   Listen for: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🚢 Deployment

### Backend (Render / Railway / Fly.io)
1. Connect your GitHub repo
2. Set Build Command: `cd backend && npm install`
3. Set Start Command: `cd backend && npm start`
4. Add all environment variables

### Frontend (Vercel)
1. Create a new Vercel project (new account as per spec)
2. Set Root Directory: `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-backend.com/api`
4. Deploy

### Database (Supabase / MongoDB Atlas)
- Use MongoDB Atlas with a new project
- Whitelist `0.0.0.0/0` for Vercel/Render IPs
- Copy connection string to `MONGODB_URI`

---

## 🎨 Design System

The platform uses a custom dark-forest design system:

| Token | Value |
|-------|-------|
| `--accent-green` | `#3ddc84` |
| `--accent-gold` | `#d4a843` |
| `--bg-primary` | `#060d0a` |
| `--font-display` | Playfair Display |
| `--font-body` | DM Sans |

---

## 📋 Evaluation Checklist

- [x] User signup & login ✅
- [x] Subscription flow (monthly and yearly) ✅
- [x] Score entry — 5-score rolling logic ✅
- [x] Draw system logic and simulation ✅
- [x] Charity selection and contribution calculation ✅
- [x] Winner verification flow and payout tracking ✅

---

Built for **Digital Heroes** — Sample Assignment · March 2026
=======
# GOLFGIVE
>>>>>>> 9d5c74eacc72dae46c736be7ab13b114c9db7def
