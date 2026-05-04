# Hope, Inc. — Customer Management System
## Sprint 3 | Test PR-01
# End-to-End Production Test Report

| Field | Details |
|---|---|
| **Branch** | `test/sprint3-e2e-production` |
| **Document** | Full Production E2E Test Report |
| **Commit target** | `/docs/sprint3-e2e-production-report.md` |
| **Issue** | #49 — [S3-M5] test/sprint3-e2e-production |
| **Role** | M5 — QA / Documentation Specialist |
| **Sprint** | Sprint 3 — Weeks 5–6 |
| **Test Environment** | Vercel — Production URL (HopeCMS live build) |
| **Overall Result** | ✅ **26 / 26 PASSED — Sprint 3 Gate: CLEARED** |

---

## Production Test Accounts

| User Type | Email | record_status | Notes |
|---|---|---|---|
| **SUPERADMIN** | jcesperanza@neu.edu.ph | ACTIVE | Seeded SUPERADMIN. All 9 rights = 1. |
| **ADMIN** | frinzbrothers@gmail.com | ACTIVE | Sales Manager. CUST_DEL=0, ADM_USER=1. |
| **USER** | (registered test account) | ACTIVE | Sales Staff. All CRUD/ADM rights = 0. |

---

## Master Test Case Summary

| TC# | Test Case Title | Feature Area | User Type | Result |
|---|---|---|---|---|
| TC-01 | Email Login — Production | Authentication | All | ✅ PASS |
| TC-02 | Google OAuth — Production | Authentication | All | ✅ PASS |
| TC-03 | Login Guard — INACTIVE Account | Authentication | USER | ✅ PASS |
| TC-04 | Customer List — ACTIVE Filter (USER) | Customer Module | USER | ✅ PASS |
| TC-05 | Add Customer — SUPERADMIN & ADMIN | Customer Module | SA / ADMIN | ✅ PASS |
| TC-06 | Edit Customer — SUPERADMIN & ADMIN | Customer Module | SA / ADMIN | ✅ PASS |
| TC-07 | Soft-Delete Customer — SUPERADMIN | Customer Module | SUPERADMIN | ✅ PASS |
| TC-08 | Soft-Delete Button Hidden — ADMIN | Customer Module | ADMIN | ✅ PASS |
| TC-09 | Soft-Delete Button Hidden — USER | Customer Module | USER | ✅ PASS |
| TC-10 | Deleted Customers Panel — ADMIN/SA | Customer Module | ADMIN / SA | ✅ PASS |
| TC-11 | Customer Recovery — ADMIN | Customer Module | ADMIN | ✅ PASS |
| TC-12 | Stamp Column Gating | Customer Module | All | ✅ PASS |
| TC-13 | Sales History Panel — All User Types | Sales Module | All | ✅ PASS |
| TC-14 | Sales Detail Drill-Down | Sales Module | All | ✅ PASS |
| TC-15 | Sales Page — Zero Mutation Controls | View-Only | All | ✅ PASS |
| TC-16 | Products Page — Zero Mutation Controls | View-Only | All | ✅ PASS |
| TC-17 | Price History — Zero Mutation Controls | View-Only | All | ✅ PASS |
| TC-18 | Customer Sales Summary Report | Reports | SA / ADMIN | ✅ PASS |
| TC-19 | Top Customers Report | Reports | SA / ADMIN | ✅ PASS |
| TC-20 | Product Revenue Report | Reports | SA / ADMIN | ✅ PASS |
| TC-21 | Admin Module — User Activation | Admin Module | ADMIN / SA | ✅ PASS |
| TC-22 | Admin Module — User Deactivation | Admin Module | ADMIN / SA | ✅ PASS |
| TC-23 | Admin Module — Hidden from USER | Admin Module | USER | ✅ PASS |
| TC-24 | SUPERADMIN Row — UI Buttons Disabled | SUPERADMIN Guard | ADMIN | ✅ PASS |
| TC-25 | SUPERADMIN Row — RLS Blocks API Call | SUPERADMIN Guard | ADMIN | ✅ PASS |
| TC-26 | No Hard Deletes in Codebase | Security Audit | N/A | ✅ PASS |
| **TOTAL** | **26 test cases across all feature areas** | **All areas** | **All types** | ✅ **26 / 26 PASS** |

---

## Section 3 — Authentication Tests

---

### TC-01 — Email Login — Production ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Authentication — Email / Password |
| **User Type(s)** | SUPERADMIN, ADMIN, USER (tested individually) |
| **Environment** | Production (Vercel) |
| **Preconditions** | Production URL live. All three accounts have record_status = ACTIVE. |

**Test Steps**
1. Navigate to the production login URL.
2. Enter email and password for SUPERADMIN account. Click Sign In.
3. Verify redirect to /customers. Confirm username displayed in navbar.
4. Sign out. Repeat for ADMIN account.
5. Sign out. Repeat for USER account.

**Expected Result**
All three accounts log in successfully via email/password and land on /customers. Correct username shown in navbar.

**Actual Result**
All three accounts authenticated successfully. Navbar displayed correct username for each. Redirected to /customers as expected.

**Notes**
Supabase email auth confirmed operational in production environment. Auth confirmation emails delivered for new registrations.


---

### TC-02 — Google OAuth — Production ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Authentication — Google OAuth 2.0 |
| **User Type(s)** | SUPERADMIN (Google account linked) |
| **Environment** | Production (Vercel) |
| **Preconditions** | Google Cloud Console OAuth configured. Production /auth/callback URL added to Supabase redirect URLs. |

**Test Steps**
1. Navigate to production login page.
2. Click "Sign in with Google" button.
3. Select Google account in the OAuth consent popup.
4. Observe redirect to /auth/callback → /customers.
5. Confirm username/email shown in navbar matches Google account.

**Expected Result**
Google OAuth completes without error. User lands on /customers. Session is established with correct user_type.

**Actual Result**
Google OAuth consent screen appeared correctly. After selection, redirected to /auth/callback, then to /customers. Session established with correct user data.

**Notes**
Production OAuth redirect URL (https://[app-domain]/auth/callback) verified in Supabase Dashboard. Google Cloud Console client ID matched.


---

### TC-03 — Login Guard — INACTIVE Account Blocked ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Authentication — Login Guard |
| **User Type(s)** | USER (record_status = INACTIVE) |
| **Environment** | Production (Vercel) |
| **Preconditions** | A test account exists with record_status = INACTIVE (not yet activated by admin). |

**Test Steps**
1. Attempt to log in with the INACTIVE user account credentials.
2. Observe the error message displayed.
3. Confirm no redirect to /customers occurs.
4. Confirm user is signed out automatically.

**Expected Result**
Login is blocked. Error message: "Your account is pending activation by a Sales Manager." User remains on /login.

**Actual Result**
Login guard fired correctly. Error message displayed as expected. No redirect to /customers. Supabase signOut() called automatically.

**Notes**
Login guard checks record_status on every SIGNED_IN event via onAuthStateChange. Confirmed working for both email and Google auth paths.


---

## Section 4 — Customer Module Tests

---

### TC-04 — Customer List — ACTIVE Filter Enforced for USER ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — CustomerListPage |
| **User Type(s)** | USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | At least one customer has record_status = INACTIVE (e.g. C0001 soft-deleted). USER account is logged in. |

**Test Steps**
1. Log in as USER. Navigate to /customers.
2. Confirm the list loads and shows customer records.
3. Search for any known INACTIVE customer (e.g. C0001 — Globus Medical, Inc).
4. Confirm C0001 does not appear in the list.
5. Open browser console and run: `const {data} = await supabase.from("customer").select("*");` — inspect results for any INACTIVE records.

**Expected Result**
INACTIVE customers are invisible to USER in both the UI and direct API call. RLS enforces ACTIVE-only at DB level.

**Actual Result**
C0001 absent from customer list. Console query returned only ACTIVE records. Zero INACTIVE rows returned by Supabase for USER role.

**Notes**
Both client-side filter (`getCustomers("USER")` applies `.eq("record_status","ACTIVE")`) and the `cust_visibility` RLS policy independently enforce this.


---

### TC-05 — Add Customer — SUPERADMIN & ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — AddCustomerModal |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | Production CMS running. CUST_ADD = 1 for SUPERADMIN and ADMIN. |

**Test Steps**
1. Log in as SUPERADMIN. Confirm "Add Customer" button is visible on CustomerListPage.
2. Click Add Customer. Fill in: custno=C0083, custname=Test Corp, address=123 Test St, payterm=30D.
3. Submit. Confirm C0083 appears in the customer list.
4. Log out. Log in as ADMIN. Repeat add with custno=C0084.
5. Confirm C0084 appears in the list.
6. Log in as USER. Confirm "Add Customer" button is NOT visible.

**Expected Result**
Add Customer button visible and functional for SUPERADMIN and ADMIN. Button absent for USER.

**Actual Result**
Add Customer button visible for SUPERADMIN and ADMIN. Customers C0083 and C0084 successfully created. Button completely absent for USER.

**Notes**
AddCustomerModal gated by `rights.CUST_ADD === 1`. Supabase INSERT RLS policy also enforces CUST_ADD check at DB level.


---

### TC-06 — Edit Customer — SUPERADMIN & ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — EditCustomerModal |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | C0083 exists. CUST_EDIT = 1 for SUPERADMIN and ADMIN. |

**Test Steps**
1. Log in as SUPERADMIN. Locate C0083 in the customer list.
2. Click the Edit button. Update custname to "Test Corp Updated". Save.
3. Confirm updated name appears in list.
4. Log in as ADMIN. Edit C0083 address. Confirm update persists.
5. Log in as USER. Confirm no Edit button visible on any row.

**Expected Result**
Edit button functional for SUPERADMIN and ADMIN. Changes persist. Edit button absent for USER.

**Actual Result**
Edit modal opened and saved correctly for both SUPERADMIN and ADMIN. Changes reflected immediately in list. No edit button rendered for USER.

**Notes**
EditCustomerModal pre-fills existing values. payterm dropdown restricted to COD/30D/45D. UPDATE RLS policy on customer checks CUST_EDIT = 1.


---

### TC-07 — Soft-Delete Customer — SUPERADMIN Only ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — SoftDeleteConfirmDialog |
| **User Type(s)** | SUPERADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | C0083 exists with record_status = ACTIVE. CUST_DEL = 1 for SUPERADMIN only. |

**Test Steps**
1. Log in as SUPERADMIN. Locate C0083.
2. Click the Delete button. Confirm SoftDeleteConfirmDialog appears with customer name.
3. Confirm deletion. Observe C0083 disappears from the active list.
4. Navigate to /deleted-customers. Confirm C0083 appears with stamp.
5. Verify in Supabase Dashboard: C0083 record_status = INACTIVE. No DELETE SQL executed.

**Expected Result**
C0083 moves to INACTIVE state. Stamp updated. No hard delete occurs. C0083 visible in Deleted Customers panel.

**Actual Result**
SoftDeleteConfirmDialog displayed C0083 name correctly. After confirm, C0083 disappeared from active list. Stamp updated with DEACTIVATED audit string. Visible in Deleted Customers panel.

**Notes**
`softDeleteCustomer()` uses `.update({ record_status: "INACTIVE", stamp: makeStamp(...) })`. No DELETE SQL involved. Confirmed via Supabase logs.


---

### TC-08 — Soft-Delete Button Hidden — ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — Button Gating |
| **User Type(s)** | ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | ADMIN logged in. CUST_DEL = 0 for ADMIN. |

**Test Steps**
1. Log in as ADMIN. Navigate to /customers.
2. Inspect each customer row — confirm no Delete button is rendered.
3. Inspect browser DOM to confirm the delete button element does not exist in markup.
4. Open console and attempt: `supabase.from("customer").update({record_status:"INACTIVE"}).eq("custno","C0002")` — observe RLS response.

**Expected Result**
Zero Delete buttons visible. DOM has no delete button elements. Direct API attempt blocked by RLS.

**Actual Result**
No delete buttons found on any row for ADMIN. DOM inspection confirmed absence of button element. Console UPDATE for soft-delete returned RLS violation error.

**Notes**
Delete button rendered only when `rights.CUST_DEL === 1`. ADMIN has CUST_DEL = 0. RLS UPDATE policy for record_status → INACTIVE also requires CUST_DEL = 1.


---

### TC-09 — Soft-Delete Button Hidden — USER ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — Button Gating |
| **User Type(s)** | USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | USER logged in. CUST_DEL = 0 for USER. |

**Test Steps**
1. Log in as USER. Navigate to /customers.
2. Confirm no Add, Edit, or Delete buttons are visible on any row.
3. Inspect DOM — confirm all three mutation buttons are architecturally absent.

**Expected Result**
Zero Add, Edit, or Delete buttons present for USER. Read-only customer list.

**Actual Result**
Customer list rendered in read-only mode for USER. No Add, Edit, or Delete buttons present in UI or DOM.

**Notes**
USER has CUST_ADD=0, CUST_EDIT=0, CUST_DEL=0. All three button components are conditionally un-rendered based on `useRights()` hook.


---

### TC-10 — Deleted Customers Panel — ADMIN & SUPERADMIN Only ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — DeletedCustomersPage |
| **User Type(s)** | ADMIN, SUPERADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | C0083 is INACTIVE. Sidebar link and /deleted-customers route tested for all user types. |

**Test Steps**
1. Log in as ADMIN. Confirm "Deleted Customers" link is visible in sidebar.
2. Navigate to /deleted-customers. Confirm C0083 appears with custno, custname, and stamp.
3. Log in as SUPERADMIN. Confirm same visibility.
4. Log in as USER. Confirm "Deleted Customers" link is ABSENT from sidebar.
5. Manually navigate to /deleted-customers as USER. Confirm redirect to /customers.

**Expected Result**
ADMIN and SUPERADMIN see Deleted Customers panel with INACTIVE records. USER sees no sidebar link and is redirected by route guard.

**Actual Result**
Deleted Customers panel fully functional for ADMIN and SUPERADMIN. C0083 visible with stamp. USER sidebar has no Deleted Customers link. Manual URL navigation redirected USER to /customers.

**Notes**
Route guard in ProtectedRoute checks user_type. Sidebar link rendered only when user_type is ADMIN or SUPERADMIN. Both checks are independent.


---

### TC-11 — Customer Recovery — ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — Recovery Flow |
| **User Type(s)** | ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | C0083 is INACTIVE in Deleted Customers panel. ADMIN is logged in. |

**Test Steps**
1. Log in as ADMIN. Navigate to /deleted-customers. Locate C0083.
2. Click the Recover button.
3. Navigate to /customers. Confirm C0083 reappears in the active list.
4. Log in as USER. Confirm C0083 is now visible.
5. Verify stamp column on C0083 shows REACTIVATED audit string.

**Expected Result**
C0083 moves back to ACTIVE. Immediately visible in all customer lists including USER view. Stamp updated.

**Actual Result**
C0083 reappeared in active customer list for all user types after recovery. Stamp updated to REACTIVATED with timestamp and admin userId.

**Notes**
`recoverCustomer()` uses `.update({ record_status: "ACTIVE", stamp: makeStamp("REACTIVATED", userId) })`. RLS recovery policy permits ADMIN and SUPERADMIN.


---

### TC-12 — Stamp Column Gating ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Customer Module — Stamp Visibility |
| **User Type(s)** | USER, ADMIN, SUPERADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | At least one customer has a non-null stamp value. |

**Test Steps**
1. Log in as USER. Navigate to /customers. Confirm no "Stamp" column header or values.
2. Log in as ADMIN. Navigate to /customers. Confirm "Stamp" column is visible.
3. Log in as SUPERADMIN. Confirm same stamp visibility.
4. Inspect DOM as USER to confirm stamp column is not merely hidden via CSS — it must be absent from markup.

**Expected Result**
Stamp column absent from USER view (not in DOM). Present for ADMIN and SUPERADMIN.

**Actual Result**
USER customer list has no stamp column in DOM. ADMIN and SUPERADMIN views show stamp column populated with audit strings. Confirmed via DOM inspection.

**Notes**
Stamp column rendered conditionally: `currentUser.user_type !== "USER"`. Column is architecturally absent for USER, not hidden via CSS.


---

## Section 5 — Sales Drill-Down Tests

---

### TC-13 — Sales History Panel — All User Types ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Sales Module — SalesHistoryPanel |
| **User Type(s)** | SUPERADMIN, ADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | CustomerDetailPage accessible. Customer C0001 (Globus Medical, Inc) has 3 transactions: TR000001, TR000006, TR000017. |

**Test Steps**
1. Log in as SUPERADMIN. Navigate to CustomerDetailPage for C0001.
2. Confirm SalesHistoryPanel lists TR000001, TR000006, TR000017 with salesDate and empNo.
3. Confirm no Add, Edit, or Delete buttons appear in the sales history panel.
4. Repeat as ADMIN and USER — confirm same read-only sales history.

**Expected Result**
Sales history list displays correctly for all user types. Zero mutation controls present in panel for all user types.

**Actual Result**
SalesHistoryPanel displayed all 3 transactions correctly for SUPERADMIN, ADMIN, and USER. No action buttons in the panel for any user type.

**Notes**
`getSalesByCustomer(custNo)` is a read-only Supabase query. SalesHistoryPanel component has no conditional mutation buttons — they are architecturally absent.


---

### TC-14 — Sales Detail Drill-Down — Line Items with Product & Price ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Sales Module — SalesDetailModal |
| **User Type(s)** | SUPERADMIN, ADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | C0001 CustomerDetailPage open. TR000001 has 4 line items: AK0002 (x10), AM0003 (x10), MD0001 (x10), PC0002 (x10). |

**Test Steps**
1. Log in as SUPERADMIN. Open CustomerDetailPage for C0001.
2. Click TR000001 in the SalesHistoryPanel.
3. Confirm SalesDetailModal opens showing: prodCode, product description, quantity, and unit price from latest priceHist entry.
4. Verify AK0002 shows description "Micro Innovations Kb", qty 10, unit price from priceHist.
5. Confirm zero mutation buttons inside the modal.
6. Repeat test as ADMIN and USER.

**Expected Result**
SalesDetailModal shows correct line items with product description and current price. No mutation controls in modal for any user type.

**Actual Result**
SalesDetailModal opened for TR000001 and displayed all 4 line items correctly. Product descriptions matched product table. Unit prices matched latest priceHist entry. No action buttons present.

**Notes**
`getSalesDetail(transNo)` joins salesDetail with product and priceHist (using MAX effDate subquery). Modal is read-only for all user types.


---

## Section 6 — View-Only Enforcement — Production Verification

---

### TC-15 — Sales Page — Zero Mutation Controls in Production ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | View-Only Enforcement — /sales |
| **User Type(s)** | SUPERADMIN, ADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | Production CMS running. /sales accessible by all user types. |

**Test Steps**
1. Log in as SUPERADMIN. Navigate to /sales.
2. Inspect the full page — confirm zero Add, Edit, or Delete buttons.
3. Open console: attempt `supabase.from("sales").insert({transNo:"TR999999",...})`.
4. Repeat DOM inspection and API attempt as ADMIN and USER.

**Expected Result**
Zero mutation buttons on /sales for all user types. INSERT blocked by RLS for all roles.

**Actual Result**
No Add/Edit/Delete buttons found on /sales for any user type. Console INSERT returned RLS policy violation for SUPERADMIN, ADMIN, and USER.

**Notes**
SELECT-only RLS policy: `sales_select_only ON sales FOR SELECT TO authenticated USING (true)`. No INSERT/UPDATE/DELETE policies exist.


---

### TC-16 — Products Page — Zero Mutation Controls in Production ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | View-Only Enforcement — /products |
| **User Type(s)** | SUPERADMIN, ADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | Production CMS running. /products accessible by all user types. |

**Test Steps**
1. Log in as each user type. Navigate to /products.
2. Confirm ProductCataloguePage shows prodCode, description, unit, and current price.
3. Inspect DOM — confirm zero Add Product, Edit Product, or Delete Product buttons.
4. Attempt: `supabase.from("product").update({description:"hacked"}).eq("prodCode","AK0001")`.

**Expected Result**
Product catalogue read-only for all user types. UPDATE blocked by RLS.

**Actual Result**
Zero mutation controls on /products for SUPERADMIN, ADMIN, and USER. Console UPDATE returned RLS violation. Product data displayed correctly (52 products, current price from product_current_price view).

**Notes**
product and priceHist have SELECT-only RLS. ProductCataloguePage component contains no mutation elements.


---

### TC-17 — Price History — Zero Mutation Controls in Production ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | View-Only Enforcement — priceHist via SalesDetailModal |
| **User Type(s)** | SUPERADMIN, ADMIN, USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | Price history is surfaced through SalesDetailModal (unit price column) and ProductCataloguePage (current price). |

**Test Steps**
1. Log in as SUPERADMIN. Open SalesDetailModal for any transaction.
2. Confirm unit price column is read-only — no edit field or price override button.
3. Attempt: `supabase.from("priceHist").insert({effDate:"2026-01-01",prodCode:"AK0001",unitPrice:999})`.
4. Repeat as ADMIN and USER.

**Expected Result**
Price history data is read-only in all surfaces. INSERT to priceHist blocked by RLS for all roles.

**Actual Result**
Unit price column in SalesDetailModal is display-only. No price edit controls anywhere in the application. Console INSERT to priceHist returned RLS violation for all three user types.

**Notes**
priceHist RLS: SELECT-only. No INSERT/UPDATE/DELETE policies. All price rendering uses the `product_current_price` SQL view.


---

## Section 7 — Reports Tests

---

### TC-18 — Customer Sales Summary Report ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Reports — CustomerSalesSummaryPage |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | `customer_sales_summary` SQL view deployed. Report page accessible via Reports sidebar link. |

**Test Steps**
1. Log in as SUPERADMIN. Navigate to Customer Sales Summary report page.
2. Confirm table shows: customer name, transaction count, total spend (formatted as currency), last sale date.
3. Confirm data is sortable by column headers.
4. Search for "Globus Medical" — confirm C0001 row appears with correct transaction count.
5. Confirm report is read-only — no add/edit/delete actions on any row.

**Expected Result**
Report loads correctly. Data from customer_sales_summary view. Sortable and searchable. Read-only.

**Actual Result**
Customer Sales Summary report loaded with data for all 82 customers. Sorting by total spend worked correctly. Search for "Globus Medical" returned C0001 with correct figures. No mutation controls.

**Notes**
`getCustomerSalesSummary()` queries the `customer_sales_summary` view (JOINs customer + sales + salesDetail + priceHist using MAX effDate price).


---

### TC-19 — Top Customers Report ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Reports — TopCustomersPage |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | `customer_sales_summary` view deployed. Top 10 customers by totalSpend available. |

**Test Steps**
1. Log in as SUPERADMIN. Navigate to Top Customers report page.
2. Confirm ranked list or bar chart displays top 10 customers by total spend.
3. Click on a customer entry — confirm navigation to that CustomerDetailPage.
4. Verify ranking order matches descending totalSpend from customer_sales_summary.

**Expected Result**
Top 10 customers ranked by spend. Linked to CustomerDetailPage. Read-only.

**Actual Result**
Top Customers leaderboard/chart displayed top 10 correctly ranked by total spend. Click on a customer navigated to their CustomerDetailPage. Rankings matched `customer_sales_summary ORDER BY totalSpend DESC`.

**Notes**
`getTopCustomers()` queries customer_sales_summary view with `.limit(10).order("totalSpend", { ascending: false })`.


---

### TC-20 — Product Revenue Report ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Reports — ProductRevenuePage |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | `product_revenue` SQL view deployed. Report page accessible. |

**Test Steps**
1. Log in as SUPERADMIN. Navigate to Product Revenue report page.
2. Confirm table shows: product description, total qty sold, total revenue.
3. Verify no add, edit, or delete actions on any row.
4. Confirm data is ordered by total revenue descending.

**Expected Result**
Product Revenue report loads with SUM(qty × current price) per product. Read-only.

**Actual Result**
Product Revenue report displayed all 52 products with correct totals. Ordered by revenue descending. No mutation controls present.

**Notes**
`getProductRevenue()` queries `product_revenue` view (SUM quantity × latest priceHist unitPrice per product).


---

## Section 8 — Admin Module Tests

---

### TC-21 — Admin Module — User Activation ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Admin Module — UserManagementPage |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | A USER account exists with record_status = INACTIVE (pending activation). ADMIN has ADM_USER = 1. |

**Test Steps**
1. Log in as ADMIN. Navigate to Admin Module (/admin).
2. Locate the INACTIVE user account in the user list.
3. Click the Activate button for that user.
4. Confirm user record_status changes to ACTIVE in the table.
5. Have that user attempt to log in — confirm login now succeeds.

**Expected Result**
ADMIN can activate INACTIVE user accounts. User can log in after activation.

**Actual Result**
INACTIVE user account activated by ADMIN. record_status changed to ACTIVE in real time. The user was then able to log in successfully with no login guard block.

**Notes**
`activateUser(userId)` updates `user.record_status = "ACTIVE"` WHERE `user_type != "SUPERADMIN"`. ADM_USER right required.


---

### TC-22 — Admin Module — User Deactivation ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Admin Module — UserManagementPage |
| **User Type(s)** | SUPERADMIN, ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | An ACTIVE USER or ADMIN account exists (non-SUPERADMIN). ADMIN is logged in. |

**Test Steps**
1. Log in as ADMIN. Navigate to Admin Module.
2. Locate an ACTIVE user account (not SUPERADMIN).
3. Click the Deactivate button.
4. Confirm record_status changes to INACTIVE.
5. Attempt to log in with that account — confirm login guard blocks access.

**Expected Result**
ADMIN can deactivate non-SUPERADMIN users. Deactivated account cannot log in.

**Actual Result**
User deactivated successfully by ADMIN. record_status changed to INACTIVE. Subsequent login attempt by that account was blocked by login guard with correct error message.

**Notes**
`deactivateUser(userId)` updates `user.record_status = "INACTIVE"` WHERE `user_type != "SUPERADMIN"`. RLS also enforces this constraint.


---

### TC-23 — Admin Module Hidden from USER ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Admin Module — Sidebar & Route Guard |
| **User Type(s)** | USER |
| **Environment** | Production (Vercel) |
| **Preconditions** | USER logged in. ADM_USER = 0 for USER. |

**Test Steps**
1. Log in as USER.
2. Confirm "Admin" link is not visible in the sidebar.
3. Manually navigate to /admin.
4. Confirm redirect to /customers (route guard blocks access).

**Expected Result**
Admin module invisible and inaccessible to USER. Sidebar link absent. Route blocked.

**Actual Result**
No Admin link in sidebar for USER. Manual navigation to /admin redirected to /customers. ADM_USER = 0 confirmed working at both UI and route levels.

**Notes**
Admin sidebar link gated by `rights.ADM_USER === 1`. ProtectedRoute also checks this right before rendering the Admin page.


---

## Section 9 — SUPERADMIN Protection Tests

---

### TC-24 — SUPERADMIN Row — UI Buttons Disabled for ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | SUPERADMIN Protection — UserManagementPage |
| **User Type(s)** | ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | ADMIN logged in on /admin. SUPERADMIN account (jcesperanza@neu.edu.ph) visible in user list. |

**Test Steps**
1. Log in as ADMIN. Navigate to /admin → UserManagementPage.
2. Locate the SUPERADMIN row (jcesperanza@neu.edu.ph).
3. Confirm Activate and Deactivate buttons are greyed out / disabled on that row.
4. Hover over the disabled buttons — confirm tooltip: "SUPERADMIN accounts cannot be modified".
5. Attempt to click the disabled buttons — confirm no action is triggered.

**Expected Result**
Both action buttons on SUPERADMIN row are disabled and non-functional. Tooltip displayed on hover.

**Actual Result**
Activate and Deactivate buttons on SUPERADMIN row rendered as disabled (opacity reduced, cursor: not-allowed). Tooltip "SUPERADMIN accounts cannot be modified" appeared on hover. Clicking produced no API call.

**Notes**
UI disabling implemented in UserManagementPage: `row.user_type === "SUPERADMIN"` → buttons disabled with tooltip. This is the first line of defence.


---

### TC-25 — SUPERADMIN Row — RLS Blocks Direct API Call from ADMIN ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | SUPERADMIN Protection — RLS Enforcement |
| **User Type(s)** | ADMIN |
| **Environment** | Production (Vercel) |
| **Preconditions** | ADMIN is logged in. SUPERADMIN userId known (user1). |

**Test Steps**
1. Log in as ADMIN. Open browser console.
2. Attempt: `supabase.from("user").update({record_status:"INACTIVE"}).eq("userId","user1")`
3. Observe the response — confirm RLS error returned.
4. Attempt: `supabase.from("UserModule_Rights").delete().eq("userId","user1")`
5. Observe RLS error.

**Expected Result**
Both API calls return RLS policy violation errors. SUPERADMIN record unmodified.

**Actual Result**
Direct UPDATE on SUPERADMIN user record returned: "new row violates row-level security policy for table user". Direct DELETE on UserModule_Rights for SUPERADMIN also returned RLS violation. SUPERADMIN record untouched.

**Notes**
RLS on user table: ADMIN can UPDATE record_status only WHERE `user_type != "SUPERADMIN"`. This is the second, database-level line of defence — independent of UI.


---

## Section 10 — Security Audit — No Hard Deletes

---

### TC-26 — No Hard Delete SQL Anywhere in Codebase or Migrations ✅ PASS

| Field | Details |
|---|---|
| **Module / Feature** | Security Audit — Codebase grep |
| **User Type(s)** | N/A |
| **Environment** | Local repository (grep on source files) |
| **Preconditions** | Full repository checked out. All /src, /db/migrations, and /supabase/functions directories present. |

**Test Steps**
1. Run: `grep -r "DELETE FROM" ./src ./db ./supabase --include="*.js" --include="*.jsx" --include="*.ts" --include="*.sql"`
2. Run: `grep -r "\.delete(" ./src --include="*.js" --include="*.jsx" --include="*.ts"`
3. Review all matches — confirm none are hard-delete SQL or Supabase `.delete()` calls on any of the 5 business tables.
4. Confirm only soft-delete via `.update({ record_status: "INACTIVE" })` is used for customer removal.
5. Verify Supabase Dashboard logs show zero DELETE operations on customer, sales, salesDetail, product, priceHist.

**Expected Result**
`grep` returns zero DELETE FROM statements targeting business tables. Zero `.delete()` Supabase calls on the 5 tables. All customer removals are soft-deletes.

**Actual Result**
grep returned zero DELETE FROM statements in application code or migration files. Zero `.delete()` Supabase JS calls found for any business table. Supabase Dashboard query logs confirm no DELETE operations. All customer removals confirmed as `UPDATE record_status → INACTIVE`.

**Notes**
RULE from Project Development Guide: "The DELETE keyword must NEVER appear anywhere in application code, Supabase functions, or RLS policies." Confirmed compliant.


---

## Section 11 — Final Pass / Fail Summary

| TC# | Title | Feature Area | User Type | Result 
|---|---|---|---|---|
| TC-01 | Email Login — Production | Authentication | All | ✅ PASS | |
| TC-02 | Google OAuth — Production | Authentication | All | ✅ PASS | |
| TC-03 | Login Guard — INACTIVE Account | Authentication | USER | ✅ PASS | |
| TC-04 | Customer List ACTIVE Filter | Customer Module | USER | ✅ PASS | |
| TC-05 | Add Customer | Customer Module | SA / ADMIN | ✅ PASS | |
| TC-06 | Edit Customer | Customer Module | SA / ADMIN | ✅ PASS | |
| TC-07 | Soft-Delete — SUPERADMIN | Customer Module | SUPERADMIN | ✅ PASS | |
| TC-08 | Delete Hidden — ADMIN | Customer Module | ADMIN | ✅ PASS | |
| TC-09 | Delete Hidden — USER | Customer Module | USER | ✅ PASS | |
| TC-10 | Deleted Customers Panel | Customer Module | ADMIN / SA | ✅ PASS | |
| TC-11 | Customer Recovery | Customer Module | ADMIN | ✅ PASS | |
| TC-12 | Stamp Column Gating | Customer Module | All | ✅ PASS | |
| TC-13 | Sales History Panel | Sales Module | All | ✅ PASS | |
| TC-14 | Sales Detail Drill-Down | Sales Module | All | ✅ PASS | |
| TC-15 | Sales Page — Zero Mutations | View-Only | All | ✅ PASS | |
| TC-16 | Products Page — Zero Mutations | View-Only | All | ✅ PASS | |
| TC-17 | Price History — Zero Mutations | View-Only | All | ✅ PASS | |
| TC-18 | Customer Sales Summary | Reports | SA / ADMIN | ✅ PASS | |
| TC-19 | Top Customers Report | Reports | SA / ADMIN | ✅ PASS | |
| TC-20 | Product Revenue Report | Reports | SA / ADMIN | ✅ PASS | |
| TC-21 | Admin — User Activation | Admin Module | ADMIN / SA | ✅ PASS | |
| TC-22 | Admin — User Deactivation | Admin Module | ADMIN / SA | ✅ PASS | |
| TC-23 | Admin Module Hidden from USER | Admin Module | USER | ✅ PASS | |
| TC-24 | SUPERADMIN Row — UI Disabled | SUPERADMIN Guard | ADMIN | ✅ PASS | |
| TC-25 | SUPERADMIN Row — RLS Blocks API | SUPERADMIN Guard | ADMIN | ✅ PASS | |
| TC-26 | No Hard Deletes in Codebase | Security Audit | N/A | ✅ PASS | |
| **TOTAL** | **26 test cases** | **All areas** | **All types** | ✅ **26 / 26 PASS** |

---

> ## ✅ Sprint 3 Gate — Full Production E2E Test: CLEARED
>
> **26 / 26 test cases PASSED** across all 3 user types, all feature areas, and all security constraints.
>
> Live URL confirmed working | Google OAuth confirmed | View-only tables mutation-free | SUPERADMIN protection at UI + DB level | No hard deletes found | All docs submitted.

