# CA Client Portal — Project Summary

_Build v1.0 · Started July 2026_

## What This Is

A SaaS web portal for Chartered Accountants (CAs) in India to manage clients, collect documents, track deadlines, and communicate service status. Clients get a simplified portal to upload documents and check their filing status.

**Target market:** Solo CAs and small CA firms (2–10 staff), India.
**Pricing model:** ₹2,999–₹5,999/month per firm (subscription SaaS).

---

## Tech Stack

- **Frontend:** React 18 + Vite 5
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Vercel (connect GitHub → auto-deploy)
- **Auth:** Supabase Auth (email/password with RLS)

---

## Project Structure

```
project CACP/
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Root component, tab routing
│   ├── index.css                 # Global styles + design tokens
│   ├── supabaseClient.js         # Supabase client init
│   ├── useAuth.js                # Auth hook (login, profile, role)
│   └── components/
│       ├── Login.jsx             # Login screen
│       ├── Layout.jsx            # Sidebar nav shell
│       ├── Dashboard.jsx         # CA dashboard with stats
│       ├── ClientsTab.jsx        # Client management (CRUD)
│       ├── DocumentsTab.jsx      # Document requests + file upload
│       ├── TasksTab.jsx          # Task/deadline tracker
│       ├── BillingTab.jsx        # Invoice tracker (no payment gateway yet)
│       ├── NoticesTab.jsx        # Firm-wide announcements
│       ├── SettingsTab.jsx       # User management + firm profile
│       └── ClientStatusTab.jsx   # Client-facing status view
├── supabase_schema.sql           # Full DB schema + RLS policies
├── package.json
├── vite.config.js
├── index.html
└── .env.example                  # Copy to .env and fill in Supabase keys
```

---

## Roles

| Role    | Access |
|---------|--------|
| `admin` | Full access — all tabs including Settings, Billing, User management |
| `staff` | Clients, Documents, Tasks, Notices — no Billing or Settings |
| `client`| My Documents (upload), My Status, Notices only |

---

## Setup Instructions

### 1. Supabase Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase_schema.sql`
3. Go to **Storage** → create a bucket named `documents` (set to Public)
4. Add storage upload policy: authenticated users can upload to `documents/`

### 2. First Admin User
1. Supabase Dashboard → **Authentication → Users → Invite user** with your email
2. In SQL Editor, run:
```sql
insert into firms (id, name, plan) values (uuid_generate_v4(), 'Your CA Firm Name', 'free')
returning id;
-- Copy the returned id, then:
insert into users (firm_id, auth_id, name, email, role)
values ('<firm-id>', '<auth-user-id>', 'Your Name', 'your@email.com', 'admin');
```

### 3. Local Dev
```bash
cd "project CACP"
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase project settings
npm install
npm run dev
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Connect repo in Vercel
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy → done

---

## MVP Features (v1.0)

- [x] Multi-role auth (admin / staff / client)
- [x] Multi-tenant (firm_id isolation + RLS)
- [x] Client management (add, edit, PAN/GST/Aadhar)
- [x] Document requests + file upload to Supabase Storage
- [x] Task & deadline tracker with overdue highlighting
- [x] Billing / invoice tracker
- [x] Firm-wide notices / announcements
- [x] Client portal (documents, status, notices)
- [x] User management (add staff + client logins)

## Roadmap (v2)

- [ ] Email/SMS reminders for overdue tasks
- [ ] Client service status management (CA updates, client views)
- [ ] Payment collection (Razorpay)
- [ ] Export to PDF / Excel
- [ ] Mobile-responsive polish
- [ ] Subscription billing per firm

---

## Key Files

- `src/useAuth.js` — auth hook, role detection
- `src/App.jsx` — tab routing, role-based view switching  
- `supabase_schema.sql` — single source of truth for DB
- `src/index.css` — all design tokens (colors, spacing, components)
