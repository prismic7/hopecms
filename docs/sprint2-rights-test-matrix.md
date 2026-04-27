# Sprint 2 — Rights Test Matrix
*27 Test Cases: 3 User Types × 9 Rights*
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

## Rights Matrix Results

### SUPERADMIN — All 9 rights = 1

| # | Right | Expected | Result | Notes |
|---|-------|----------|--------|-------|
| 1 | CUST_VIEW | 1 | ✅ PASS | Customer list loads correctly |
| 2 | CUST_ADD | 1 | ✅ PASS | Add Customer button visible and functional |
| 3 | CUST_EDIT | 1 | ✅ PASS | Edit button visible on all ACTIVE customers |
| 4 | CUST_DEL | 1 | ✅ PASS | Delete button visible on ACTIVE customers only |
| 5 | SALES_VIEW | 1 | ✅ PASS | Sales page accessible, transactions load |
| 6 | SD_VIEW | 1 | ✅ PASS | Sales detail modal opens with line items |
| 7 | PROD_VIEW | 1 | ✅ PASS | Products page loads full catalogue |
| 8 | PRICE_VIEW | 1 | ✅ PASS | Price history panel loads on product select |
| 9 | ADM_USER | 1 | ✅ PASS | Admin sidebar link visible |

### ADMIN — CUST_DEL=0, ADM_USER=0, all others=1

| # | Right | Expected | Result | Notes |
|---|-------|----------|--------|-------|
| 10 | CUST_VIEW | 1 | ✅ PASS | Customer list loads correctly |
| 11 | CUST_ADD | 1 | ✅ PASS | Add Customer button visible and functional |
| 12 | CUST_EDIT | 1 | ✅ PASS | Edit button visible on all ACTIVE customers |
| 13 | CUST_DEL | 0 | ✅ PASS | Delete button not visible |
| 14 | SALES_VIEW | 1 | ✅ PASS | Sales page accessible, transactions load |
| 15 | SD_VIEW | 1 | ✅ PASS | Sales detail modal opens with line items |
| 16 | PROD_VIEW | 1 | ✅ PASS | Products page loads full catalogue |
| 17 | PRICE_VIEW | 1 | ✅ PASS | Price history panel loads on product select |
| 18 | ADM_USER | 0 | ✅ PASS | Admin sidebar link not visible |

### USER — CUST_VIEW=1, all VIEW rights=1, all CRUD/ADM=0

| # | Right | Expected | Result | Notes |
|---|-------|----------|--------|-------|
| 19 | CUST_VIEW | 1 | ✅ PASS | Customer list loads, INACTIVE rows hidden |
| 20 | CUST_ADD | 0 | ✅ PASS | Add Customer button not visible |
| 21 | CUST_EDIT | 0 | ✅ PASS | Edit button not visible on any row |
| 22 | CUST_DEL | 0 | ✅ PASS | Delete button not visible on any row |
| 23 | SALES_VIEW | 1 | ✅ PASS | Sales page accessible, transactions load |
| 24 | SD_VIEW | 1 | ✅ PASS | Sales detail modal opens with line items |
| 25 | PROD_VIEW | 1 | ✅ PASS | Products page loads full catalogue |
| 26 | PRICE_VIEW | 1 | ✅ PASS | Price history panel loads on product select |
| 27 | ADM_USER | 0 | ✅ PASS | Admin sidebar link not visible |

---

## Summary
| User Type | Tests Run | Passed | Failed |
|-----------|-----------|--------|--------|
| SUPERADMIN | 9 | 9 | 0 |
| ADMIN | 9 | 9 | 0 |
| USER | 9 | 9 | 0 |
| *Total* | *27* | *27* | *0* |

---

## Additional Checks
- ✅ Stamp column visible to ADMIN and SUPERADMIN, hidden from USER
- ✅ Deleted Customers sidebar link hidden for USER
- ✅ /deleted-customers route blocked for USER — redirects to /customers
- ✅ Admin sidebar link hidden for ADMIN and USER