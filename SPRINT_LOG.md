# Sprint Log — Hope, Inc. CMS

---

## Sprint 1 — Weeks 1–2
**Theme:** Project Setup, CMS Database & Authentication
**Dates:** April 3, 2026 to April 18, 2026

### Tasks Completed
| Member | Task | Status |
|--------|------|--------|
| M1 | feat/project-scaffold — Vite + React + Tailwind setup | ✅ Done |
| M1 | feat/supabase-client — Supabase JS client init | ✅ Done |
| M1 | feat/routing-skeleton — All CMS routes + ProtectedRoute | ✅ Done |
| M1 | chore/github-protection — Branch protection rules | ✅ Done |
| M2 | feat/ui-login-page — Login form + Google button | ✅ Done |
| M2 | feat/ui-register-page — Registration form | ✅ Done |
| M2 | feat/ui-app-shell — Navbar + sidebar + layout | ✅ Done |
| M2 | feat/ui-auth-callback — /auth/callback loading page | ✅ Done |
| M3 | db/initial-schema — HopeDB 5 tables + seed data | ✅ Done |
| M3 | db/rights-seed — 4 modules + 9 rights + SUPERADMIN | ✅ Done |
| M3 | docs/db-erd — ERD diagram | ✅ Done |
| M3 | db/verify-seed — Verification queries | ✅ Done |
| M4 | feat/auth-context — AuthContext + session listener | ✅ Done |
| M4 | feat/auth-email — Email signUp/signIn wired | ✅ Done |
| M4 | feat/auth-google — Google OAuth + /auth/callback | ✅ Done |
| M4 | db/trigger-provision-user — Auto-provision trigger | ✅ Done |
| M5 | test/sprint1-auth-flows — Auth test cases | ✅ Done |
| M5 | docs/sprint1-log-readme — This sprint log + README | ✅ Done |

### Blockers & Resolutions
| Blocker | Raised By | Resolution |
|---------|-----------|------------|
| [Had problems resolving issues with the auth] | [M4] | [It took some time but was eventually resolved through trial and error.] |

---

## Sprint 2 — Weeks 3–4
**Theme:** Customer CRUD, Sales Views & Rights Enforcement
**Dates:** April 19, 2026 to May 2, 2026

### Tasks Completed
| Member | Task | Status |
|--------|------|--------|
| M1 | feat/customer-api — getCustomers, addCustomer, updateCustomer, softDelete, recover | ✅ Done |
| M1 | feat/sales-product-api — Read-only service functions for sales, salesDetail, product, priceHist | ✅ Done |
| M1 | feat/rights-context-integration — UserRightsContext wired at app root | ✅ Done |
| M1 | feat/route-guard-deleted — /deleted-customers blocked for USER | ✅ Done |
| M2 | feat/ui-customer-list — CustomerListPage with stamp gating + soft-delete filter | ✅ Done |
| M2 | feat/ui-customer-crud — AddCustomerModal + EditCustomerModal + SoftDeleteConfirmDialog | ✅ Done |
| M2 | feat/ui-customer-detail — CustomerDetailPage + SalesHistoryPanel + SalesDetailModal | ✅ Done |
| M2 | feat/ui-product-catalogue — Read-only ProductCataloguePage | ✅ Done |
| M2 | feat/ui-deleted-customers — DeletedCustomersPage + sidebar link gating | ✅ Done |
| M3 | db/rls-customer — SELECT visibility + INSERT + UPDATE (edit + deactivate + recover) policies | ✅ Done |
| M3 | db/rls-view-only-tables — SELECT-only RLS for sales, salesDetail, product, priceHist | ✅ Done |
| M3 | db/view-product-current-price — product_current_price SQL view | ✅ Done |
| M3 | db/view-customer-sales-summary — customer_sales_summary SQL view | ✅ Done |
| M4 | feat/rights-context — UserRightsContext + useRights hook (9 rights) | ✅ Done |
| M4 | feat/rights-customer-gating — Add/Edit/Delete button gating + stamp column visibility | ✅ Done |
| M4 | feat/rights-sidebar-nav — Sidebar link gating for Deleted Customers and Admin | ✅ Done |
| M5 | test/sprint2-rights-27-cases — Full 27-case rights test matrix | ✅ Done |
| M5 | test/sprint2-viewonly-softdelete — View-only enforcement + soft-delete + recovery + bypass tests | ✅ Done |

### Blockers & Resolutions
| Blocker | Raised By | Resolution |
|---------|-----------|------------|
| None | — | — |

---

## Sprint 3 — Weeks 5–6
**Theme:** Admin Module, CMS Reports, Deployment & Documentation
**Dates:** May 3, 2026 to May 16, 2026

### Tasks Completed
| Member | Task | Status |
|--------|------|--------|
| M1 | feat/admin-api — getUsers + activateUser + deactivateUser (SUPERADMIN-blocked) | ✅ Done |
| M1 | feat/reports-api — Customer sales summary + top customers + product revenue | ✅ Done |
| M1 | chore/production-deploy — Vercel/Netlify config + production env vars + redirect URLs | ✅ Done |
| M2 | feat/ui-admin-users — UserManagementPage with SUPERADMIN row protection | ✅ Done |
| M2 | feat/ui-reports — CustomerSalesSummaryPage + TopCustomersPage + ProductRevenuePage | ✅ Done |
| M2 | fix/ui-final-polish — Loading states, empty states, error handling, mobile fixes | ✅ Done |
| M3 | db/view-product-revenue — product_revenue SQL view | ✅ Done |
| M3 | db/rls-admin-module — User table + UserModule_Rights RLS with SUPERADMIN guard | ✅ Done |
| M3 | docs/final-rls-audit — Final RLS audit confirming all policies and no hard deletes | ✅ Done |
| M4 | feat/rights-admin-module — ADM_USER sidebar gating | ✅ Done |
| M4 | feat/rights-superadmin-guard — SUPERADMIN row disabling in UserManagementPage | ✅ Done |
| M4 | test/e2e-rights-production — Production regression test log (all 3 user types) | ✅ Done |
| M5 | test/sprint3-e2e-production — Full production test report with screenshots | ✅ Done |
| M5 | docs/user-manual-final — Finalized CMS User Manual | ✅ Done |
| M5 | docs/presentation-slides — 12-slide presentation deck | ✅ Done |

### Blockers & Resolutions
| Blocker | Raised By | Resolution |
|---------|-----------|------------|
| None | — | — |