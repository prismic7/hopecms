# Sprint 2 — View-Only Enforcement, Soft-Delete, Recovery & Bypass Tests
Tested by: M5 | Sprint 2 | All cases: PASS

---

## Test Environment
- App URL: http://localhost:5173
- Database: Supabase (HopeCMS project)
- Test accounts:
  - SUPERADMIN: jcesperanza@neu.edu.ph
  - ADMIN: frinzbrothers@gmail.com
  - USER: (registered test account)

---

## 1. View-Only Enforcement Tests

### Objective
Confirm that Sales, SalesDetail, Product, and PriceHistory pages render
zero add/edit/delete buttons for ALL three user types.

| # | Page | User Type | Add Button | Edit Button | Delete Button | Result |
|---|------|-----------|------------|-------------|---------------|--------|
| 1 | Sales | SUPERADMIN | None | None | None | ✅ PASS |
| 2 | Sales | ADMIN | None | None | None | ✅ PASS |
| 3 | Sales | USER | None | None | None | ✅ PASS |
| 4 | Products | SUPERADMIN | None | None | None | ✅ PASS |
| 5 | Products | ADMIN | None | None | None | ✅ PASS |
| 6 | Products | USER | None | None | None | ✅ PASS |
| 7 | Sales Detail Modal | SUPERADMIN | None | None | None | ✅ PASS |
| 8 | Sales Detail Modal | ADMIN | None | None | None | ✅ PASS |
| 9 | Sales Detail Modal | USER | None | None | None | ✅ PASS |

*Result: All view-only pages confirmed mutation-free for all user types.*

---

## 2. Soft-Delete Visibility Tests

### Objective
Confirm that soft-deleted customers are invisible to USER accounts
and visible to ADMIN/SUPERADMIN in the Deleted Customers panel.

### Test Steps
1. Log in as SUPERADMIN
2. Soft-delete customer C0001 (Globus Medical, Inc)
3. Confirm C0001 disappears from the customer list
4. Log out and log in as USER
5. Confirm C0001 is not visible in the customer list
6. Confirm C0001 cannot be found via search
7. Log out and log in as ADMIN
8. Confirm C0001 appears in Deleted Customers panel with stamp

| # | Test Case | Expected | Result |
|---|-----------|----------|--------|
| 1 | SUPERADMIN soft-deletes C0001 | record_status = INACTIVE, stamp updated | ✅ PASS |
| 2 | C0001 disappears from customer list after soft-delete | Not visible | ✅ PASS |
| 3 | USER cannot see C0001 in list | Hidden | ✅ PASS |
| 4 | USER cannot find C0001 via search | Hidden | ✅ PASS |
| 5 | ADMIN sees C0001 in Deleted Customers panel | Visible with stamp | ✅ PASS |
| 6 | SUPERADMIN sees C0001 in Deleted Customers panel | Visible with stamp | ✅ PASS |

---

## 3. Recovery Tests

### Objective
Confirm that ADMIN and SUPERADMIN can recover soft-deleted customers
and that recovered customers reappear in all views.

### Test Steps
1. Log in as ADMIN
2. Navigate to Deleted Customers panel
3. Click Recover on C0001
4. Confirm C0001 reappears in the customer list
5. Confirm C0001 is visible to USER accounts again

| # | Test Case | Expected | Result |
|---|-----------|----------|--------|
| 1 | ADMIN recovers C0001 | record_status = ACTIVE, stamp updated | ✅ PASS |
| 2 | C0001 reappears in customer list after recovery | Visible | ✅ PASS |
| 3 | C0001 visible to USER after recovery | Visible | ✅ PASS |
| 4 | SUPERADMIN can also recover deleted customers | Visible | ✅ PASS |

---

## 4. RLS Bypass Tests

### Objective
Confirm that RLS blocks INACTIVE customers from USER accounts
even when the ACTIVE filter is bypassed at the application layer.

### Test Steps
1. Log in as USER
2. Soft-delete C0001 as SUPERADMIN (via separate session)
3. Confirm USER's customer list does not show C0001
4. Confirm RLS blocks the row even without the app-level filter

| # | Test Case | Expected | Result |
|---|-----------|----------|--------|
| 1 | USER calls getCustomers() — INACTIVE rows blocked by RLS | Not returned | ✅ PASS |
| 2 | USER cannot access /deleted-customers via URL | Redirected to /customers | ✅ PASS |

---

## 5. Stamp Visibility Tests

### Objective
Confirm that the stamp column is visible to ADMIN and SUPERADMIN
and hidden from USER accounts.

| # | Test Case | Expected | Result |
|---|-----------|----------|--------|
| 1 | Log in as USER — stamp column in customer list | Not visible | ✅ PASS |
| 2 | Log in as ADMIN — stamp column in customer list | Visible | ✅ PASS |
| 3 | Log in as SUPERADMIN — stamp column in customer list | Visible | ✅ PASS |
| 4 | Stamp updates on soft-delete | DEACTIVATED by [id] on [date] | ✅ PASS |
| 5 | Stamp updates on recovery | REACTIVATED by [id] on [date] | ✅ PASS |

---

## Summary
| Test Suite | Tests Run | Passed | Failed |
|------------|-----------|--------|--------|
| View-Only Enforcement | 9 | 9 | 0 |
| Soft-Delete Visibility | 6 | 6 | 0 |
| Recovery | 4 | 4 | 0 |
| RLS Bypass | 2 | 2 | 0 |
| Stamp Visibility | 5 | 5 | 0 |
| *Total* | *26* | *26* | *0* |

---

## Sprint 2 Log

| Date | Task | Status | Notes |
|------|------|--------|-------|
| Week 3 | Customer API service functions | ✅ Done | M1 |
| Week 3 | Read-only service functions | ✅ Done | M1 |
| Week 3 | UserRightsProvider integration | ✅ Done | M1 |
| Week 3 | Route guard for /deleted-customers | ✅ Done | M1 |
| Week 3 | CustomerListPage with stamp gating | ✅ Done | M2 |
| Week 3 | Customer CRUD modals | ✅ Done | M2 |
| Week 3 | CustomerDetailPage + SalesHistoryPanel | ✅ Done | M2 |
| Week 3 | ProductCataloguePage | ✅ Done | M2 |
| Week 3 | DeletedCustomersPage | ✅ Done | M2 |
| Week 3 | RLS for customer table | ✅ Done | M3 |
| Week 3 | RLS for view-only tables | ✅ Done | M3 |
| Week 3 | product_current_price SQL view | ✅ Done | M3 |
| Week 3 | customer_sales_summary SQL view | ✅ Done | M3 |
| Week 4 | UserRightsContext real implementation | ✅ Done | M4 |
| Week 4 | Customer button gating | ✅ Done | M4 |
| Week 4 | Sidebar nav gating | ✅ Done | M4 |
| Week 4 | 27-case rights test matrix | ✅ Done | M5 |
| Week 4 | View-only + soft-delete + recovery tests | ✅ Done | M5 |

### Blockers
- camelCase column names in service files caused 400 errors — fixed with lowercase column names across all affected files
- ADMIN rights not set correctly in database — fixed with targeted SQL UPDATE
- M4 MIA — M1 took over M4 deliverables because of technical difficulties


### Sprint 2 Gate
- ✅ All 27 rights cases passed
- ✅ View-only tables confirmed mutation-free for all user types
- ✅ Soft-delete visibility enforced at UI and RLS level
- ✅ Recovery working for ADMIN and SUPERADMIN
- ✅ Stamp hidden from USER accounts
- ✅ Route guard blocking USER from /deleted-customers