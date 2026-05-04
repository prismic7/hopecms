# HopeCMS — Hope, Inc. Customer Management System

> A 6-week capstone project for BS Computer Science · New Era University  
> Built with **React 18**, **Vite**, **Tailwind CSS**, and **Supabase**

---

## Team

| Member | Role | Name |
|--------|------|------|
| M1 | Project Lead / Full-Stack | Frinz Hughwie D. Bautista |
| M2 | Frontend Developer (UI/UX) | John Pete P. Casapao |
| M3 | Backend / DB Engineer | Lorenzo Nheo M. Queñano |
| M4 | Rights & Auth Specialist | Kim G. Moguer |
| M5 | QA / Documentation | Ralph Anthony B. Biazon |

---

## Features

- **Customer Management** — View, add, edit, and soft-delete customer records
- **Sales History** — Drill into each customer's transactions and line items
- **Product Catalogue** — Read-only product listing with current pricing
- **Role-Based Access** — Three user types (SUPERADMIN, ADMIN, USER) with 9 granular rights
- **Soft Delete & Recovery** — No hard deletes; INACTIVE customers recoverable by ADMIN+
- **Google OAuth + Email Auth** — Dual sign-in with auto-provisioning and login guard
- **Reports** — Customer Sales Summary, Top Customers, and Product Revenue views
- **Admin Module** — Activate/deactivate user accounts with SUPERADMIN protection

---

## Database at a Glance

| Table | Role | Access |
|-------|------|--------|
| `customer` | Primary managed entity | Full CRUD (soft-delete only) |
| `sales` | Purchase transactions per customer | View only |
| `salesDetail` | Line items per transaction | View only |
| `product` | Product catalogue | View only |
| `priceHist` | Price history per product | View only |

> **Rule:** The `DELETE` keyword is never used. Customer removal = `record_status = 'INACTIVE'`.

---

## User Types & Rights

| Right | SUPERADMIN | ADMIN | USER |
|-------|:----------:|:-----:|:----:|
| View Customers | ✅ | ✅ | ✅ |
| Add Customer | ✅ | ✅ | ❌ |
| Edit Customer | ✅ | ✅ | ❌ |
| Soft Delete Customer | ✅ | ❌ | ❌ |
| View Sales / Details | ✅ | ✅ | ✅ |
| View Products / Prices | ✅ | ✅ | ✅ |
| Admin – Manage Users | ✅ | ❌ | ❌ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Email/Password + Google OAuth 2.0 |
| State | React Context API |
| Version Control | Git + GitHub |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |

---

## Prerequisites

Make sure you have the following installed before setting up locally:

- [Node.js](https://nodejs.org/) v18 or higher — check with `node -v`
- [Git](https://git-scm.com/) — check with `git --version`
- Supabase credentials from M3 (Project URL + anon key)

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/prismic7/hopecms.git
cd hopecms

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your Supabase URL and anon key (get from M3)

# 4. Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Branching Strategy

```
main        ← production only, no direct pushes
└── dev     ← stable base, all PRs merge here
    └── feature/fix/db/test/docs branches
```

### Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/customer-soft-delete` |
| `fix/` | Bug fix | `fix/cust-visibility-rls` |
| `db/` | Database change (schema, RLS, view, trigger) | `db/rls-customer-select` |
| `test/` | Test files | `test/rights-27-cases` |
| `docs/` | Documentation | `docs/user-manual-draft` |
| `refactor/` | Code cleanup, no behavior change | `refactor/customerService-cleanup` |
| `chore/` | Config, tooling, deployment | `chore/vercel-deploy` |

---

## Pull Request Rules

- ✅ Always branch from `dev` — never from `main`
- ✅ PR title must be specific and in imperative mood
- ✅ PR description must state: **What changed / Why / How to test**
- ✅ At least **1 teammate** must review and approve before merging
- ✅ All Vitest tests must pass locally before requesting review
- ✅ No `.env` files or Supabase keys committed
- ✅ No `console.log` statements in production code
- ✅ Delete branch from GitHub after merge
- ❌ Never push directly to `main` or `dev`
- ❌ Never merge into `main` directly — use `dev → release PR → main`

---

## Sprint Summary

| Sprint | Weeks | Theme | PRs |
|--------|-------|-------|-----|
| Sprint 1 | 1–2 | Setup, Database & Authentication | 18 |
| Sprint 2 | 3–4 | Customer CRUD, Sales Views & Rights Enforcement | 18 |
| Sprint 3 | 5–6 | Admin Module, Reports, Deployment & Documentation | 15 |

**Team total: 51 PRs across 6 weeks**

---

## Default Accounts

| Account | Email | Type | Status |
|---------|-------|------|--------|
| SUPERADMIN | jcesperanza@neu.edu.ph | SUPERADMIN | ACTIVE |
| New registrants | — | USER | INACTIVE (pending activation) |

> New users registered via email or Google OAuth are auto-provisioned as **USER / INACTIVE** and must be activated by an ADMIN or SUPERADMIN.

---

## Deployment

| Environment | URL | 
|-------------|-----|
| Production | https://hopecmsystem.vercel.app/ |
| Local Dev | http://localhost:5173 |

---

## Project Structure

```
hopecms/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── db/
│   └── migrations/
│       ├── 01_initial_schema.sql
│       ├── 02_rights_seed.sql
│       ├── 03_hopedb_data.sql
│       ├── 04_verify_seed.sql
│       ├── 05_trigger_provision_user.sql
│       ├── 06_rls_customer.sql
│       ├── 07_rls_view_only_tables.sql
│       ├── 08_view_product_current_price.sql
│       ├── 09_view_customer_sales_summary.sql
│       ├── 10_view_product_revenue.sql
│       ├── 11_rls_admin_module.sql
│       ├── 12_sync_admin_rights.sql
│       └── 13_superadmin_self_recovery.sql
│
├── docs/
│   ├── db-erd.md
│   ├── final-rls-audit.md
│   ├── sprint2-rights-test-matrix.md
│   ├── sprint2-viewonly-softdelete-tests.md
│   ├── sprint3_PR01_e2e_production_test_report.md
│   └── E2E_Rights_Test_Log_Sprint3.docx
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── AddCustomerModal.jsx
│   │   ├── AppShell.jsx
│   │   ├── EditCustomerModal.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Skeleton.jsx
│   │   ├── SoftDeleteConfirmDialog.jsx
│   │   └── Toast.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── UserRightsContext.jsx
│   │
│   ├── lib/
│   │   └── supabase.js
│   │
│   ├── pages/
│   │   ├── AdminPage.jsx
│   │   ├── AuthCallbackPage.jsx
│   │   ├── CustomerDetailPage.jsx
│   │   ├── CustomerSalesSummaryPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── DeletedCustomersPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ProductRevenuePage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── SalesPage.jsx
│   │   └── TopCustomersPage.jsx
│   │
│   ├── services/
│   │   ├── adminService.js
│   │   ├── customerService.js
│   │   ├── reportsService.js
│   │   ├── salesProductService.js
│   │   └── userService.js
│   │
│   ├── test/
│   │   ├── mocks/
│   │   │   └── supabase.js
│   │   ├── setup.js
│   │   └── sprint1-auth-flows.test.jsx
│   │
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitattributes
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── SPRINT_LOG.md
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

---

## Documentation

| Document | File |
|----------|------|
| ERD Diagram | `docs/db-erd.md` |
| Final RLS Audit | `docs/final-rls-audit.md` |
| Sprint 2 Rights Test Matrix (27 cases) | `docs/sprint2-rights-test-matrix.md` |
| Sprint 2 View-Only & Soft-Delete Tests | `docs/sprint2-viewonly-softdelete-tests.md` |
| Sprint 3 E2E Production Test Report | `docs/sprint3_PR01_e2e_production_test_report.md` |
| E2E Rights Test Log (Sprint 3) | `docs/E2E_Rights_Test_Log_Sprint3.docx` |
| Sprint Log | `SPRINT_LOG.md` |