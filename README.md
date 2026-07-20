# Expense Voucher Management System

A full-stack web application built as an internship assignment submission for **Prachay Securities Private Limited (PSPL)**. The system digitizes ABC Company's employee expense reimbursement workflow — employees create and submit vouchers with their signature, the Director reviews and approves or rejects them with a countersignature, and the Accounts team has read-only access to the full audit trail. All three roles operate from a single authenticated platform with strict role-based access control.

---

## Tech Stack

### Backend
| Library | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP server and routing |
| `@prisma/client` | ^6.19.3 | Database ORM / query builder |
| `prisma` | ^6.19.3 | Schema migrations and Prisma CLI |
| `jsonwebtoken` | ^9.0.3 | JWT-based stateless authentication |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `multer` | ^2.2.0 | Multipart form data / signature image uploads |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.4.2 | Environment variable loading |
| `nodemon` | ^3.1.14 | Dev server hot-reload |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^6.23.1 | Client-side routing and protected routes |
| `axios` | ^1.7.2 | HTTP client with request/response interceptors |
| `vite` | ^5.3.1 | Build tool and dev server |

### Database
- **PostgreSQL** hosted on **Supabase** (Transaction Pooler mode)

---

## Features

### 🧑‍💼 Employee Role
- Secure login and automatic redirect to the Employee Dashboard
- Dashboard with real-time stats: total vouchers, counts by status (Draft / Pending / Approved / Rejected), and total claimed amount
- Create expense vouchers saved as **Draft** — fields: department, expense title, category, description (optional), expense date, and amount
- Edit or delete any own **Draft** voucher
- Upload a signature image (JPEG/PNG, max 2MB) to a draft voucher; replace or delete it
- Submit a draft voucher for director approval (requires a signature to be uploaded first)
- View all own vouchers with pagination
- View full voucher details including status, rejection reason (if rejected), and approval info

### 🏢 Director Role
- Dashboard with org-wide stats: pending approval count, vouchers approved/rejected today, total pending amount, and a recent activity feed (5 items)
- **Pending Approvals** queue — paginated list of all `PENDING_APPROVAL` vouchers
- **All Vouchers** — paginated list of every voucher in the system with search/filter/sort
- Voucher detail view — full read-only information including employee signature
- **Approve** a pending voucher: requires uploading the Director's own signature; approval is atomically recorded with a timestamp
- **Reject** a pending voucher: requires a mandatory rejection reason; reason is stored and displayed to the employee
- Both actions immediately update the voucher status in the UI without a full page refresh

### 📊 Accounts Role
- Dashboard with org-wide financial stats: total vouchers, full status breakdown, total approved expense amount, and 5 most recently approved vouchers
- **All Vouchers** — same rich search/filter/sort/pagination as the Director view
- Voucher detail view — full read-only record including employee and director signatures, rejection reason, and audit timestamps
- **Print Voucher** button: client-side `window.print()` with print-optimized CSS (hides navigation elements automatically)
- **Zero write access** — no create, edit, delete, approve, reject, or submit actions anywhere in this role

---

## Project Setup Instructions

### Prerequisites
- **Node.js** v18+ (v20 recommended)
- A **Supabase** account with a PostgreSQL project, or a local PostgreSQL installation
- `npm` v9+

---

### Backend Setup

**1. Navigate to the backend directory:**
```bash
cd voucher-management/backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure environment variables:**

Create a `.env` file in the `backend/` directory. Reference `.env.example` for the required keys:

```env
# Supabase Transaction Pooler URL (for Prisma queries)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=2"

# Supabase Direct Connection URL (for Prisma migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"

# JWT signing secret (use a long random string)
JWT_SECRET="your-very-long-and-random-secret"

# Server port
PORT=5000
```

> **Note:** If using a local PostgreSQL instance, set both `DATABASE_URL` and `DIRECT_URL` to the same local connection string and remove the `pgbouncer` query parameter.

**4. Run Prisma migrations:**
```bash
npx prisma migrate deploy
```

**5. Generate the Prisma client:**
```bash
npx prisma generate
```

**6. Start the development server:**
```bash
npm run dev
```

**7. Confirm the server is running:**

Visit `http://localhost:5000/api/health` — you should see a `200 OK` response.

---

### Creating Test Users

There is **no registration UI** in the application. User accounts (and their roles) are created via the **public `POST /api/auth/register` endpoint**. You can use any HTTP client (curl, Postman, Insomnia) or Prisma Studio to create users.

**Using the API directly (recommended):**

```bash
# Create an Employee account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Employee", "email": "alice@example.com", "password": "Password123", "role": "EMPLOYEE", "employeeId": "EMP001"}'

# Create a Director account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Director", "email": "bob@example.com", "password": "Password123", "role": "DIRECTOR", "employeeId": "DIR001"}'

# Create an Accounts account
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol Accounts", "email": "carol@example.com", "password": "Password123", "role": "ACCOUNTS", "employeeId": "ACC001"}'
```

The `role` field must be exactly `EMPLOYEE`, `DIRECTOR`, or `ACCOUNTS` (uppercase).

**Using Prisma Studio (alternative):**
```bash
npx prisma studio
```
Open `http://localhost:5555`, navigate to the `User` model, and add rows manually. Passwords must be bcrypt-hashed — using the API is simpler.

---

### Frontend Setup

**1. Navigate to the frontend directory:**
```bash
cd voucher-management/frontend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure environment variables:**

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**4. Start the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port printed in the terminal).

---

## Database Schema

### Enums

**`Role`**
```
EMPLOYEE | DIRECTOR | ACCOUNTS
```

**`VoucherStatus`**
```
DRAFT | SUBMITTED | PENDING_APPROVAL | APPROVED | REJECTED
```

---

### `User` Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key, auto-generated |
| `name` | `String` | Full name |
| `email` | `String` | Unique, used for login |
| `password` | `String` | bcrypt-hashed |
| `employeeId` | `String?` | Optional company employee ID |
| `role` | `Role` | Enum — determines dashboard and permissions |
| `createdAt` | `DateTime` | Auto-set on creation |
| `updatedAt` | `DateTime` | Auto-updated on modification |

**Relations:**
- `vouchers` → List of `Voucher` records this user created (`EmployeeVouchers`)
- `approvals` → List of `Voucher` records this user approved/rejected as Director (`DirectorApprovals`)

---

### `Voucher` Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key, auto-generated |
| `voucherNumber` | `String` | Unique; auto-generated as `VCH-YYYY-XXXXXX` |
| `voucherDate` | `DateTime` | Auto-set to creation timestamp |
| `expenseDate` | `DateTime` | Date the expense was actually incurred (employee-entered) |
| `departmentName` | `String` | Required |
| `expenseTitle` | `String` | Required |
| `expenseCategory` | `String` | Required (one of predefined categories) |
| `expenseDescription` | `String?` | Optional |
| `amount` | `Float` | Must be > 0 |
| `employeeId` | `String` | Foreign key → `User.id` |
| `employeeSignature` | `String?` | Filename of uploaded signature image (stored on disk) |
| `status` | `VoucherStatus` | Default: `DRAFT` |
| `directorId` | `String?` | Foreign key → `User.id` (set on approval/rejection) |
| `directorSignature` | `String?` | Filename of director's uploaded signature |
| `approvalDate` | `DateTime?` | Timestamp of approval (null if not approved) |
| `rejectionReason` | `String?` | Rejection reason text (null if not rejected) |
| `createdAt` | `DateTime` | Auto-set on creation |
| `updatedAt` | `DateTime` | Auto-updated on modification |

**Relations:**
- `employee` → `User` (the employee who created the voucher)
- `director` → `User?` (the director who reviewed it; nullable until reviewed)

---

## API Documentation

> All protected routes require a `Bearer <token>` JWT in the `Authorization` header, obtained from `POST /api/auth/login`.

### Auth Module

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None (public) | Register a new user with a specific role |
| `POST` | `/api/auth/login` | None (public) | Authenticate and receive a JWT |

---

### Employee Module (`/api/vouchers/*`)
> All routes require `EMPLOYEE` role.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/vouchers/dashboard` | Employee dashboard statistics |
| `GET` | `/api/vouchers/my` | Paginated list of own vouchers |
| `POST` | `/api/vouchers` | Create a new voucher (saved as `DRAFT`) |
| `GET` | `/api/vouchers/:id` | Get own voucher details |
| `PUT` | `/api/vouchers/:id` | Update a `DRAFT` voucher |
| `DELETE` | `/api/vouchers/:id` | Delete a `DRAFT` voucher |
| `PATCH` | `/api/vouchers/:id/submit` | Submit a `DRAFT` voucher for approval (requires signature) |
| `POST` | `/api/vouchers/:id/signature` | Upload employee signature image (multipart/form-data, field: `signature`) |
| `DELETE` | `/api/vouchers/:id/signature` | Remove employee signature from a draft voucher |

---

### Director Module (`/api/director/*`)
> All routes require `DIRECTOR` role.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/director/dashboard` | Director dashboard statistics |
| `GET` | `/api/director/vouchers/pending` | Paginated list of `PENDING_APPROVAL` vouchers |
| `GET` | `/api/director/vouchers` | Paginated list of all vouchers (filterable/sortable) |
| `GET` | `/api/director/vouchers/:id` | Full details of any voucher |
| `PATCH` | `/api/director/vouchers/:id/approve` | Approve voucher (multipart/form-data, field: `signature`) |
| `PATCH` | `/api/director/vouchers/:id/reject` | Reject voucher (body: `{ rejectionReason: string }`) |

---

### Accounts Module (`/api/accounts/*`)
> All routes require `ACCOUNTS` role. All routes are `GET`-only — no write methods exist.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/accounts/dashboard` | Accounts dashboard statistics |
| `GET` | `/api/accounts/vouchers` | Paginated list of all vouchers (filterable/sortable) |
| `GET` | `/api/accounts/vouchers/:id` | Full read-only details of any voucher |

---

### Common Query Parameters (Voucher List Endpoints)

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 10) |
| `voucherNumber` | `string` | Case-insensitive partial match |
| `employeeName` | `string` | Case-insensitive partial match on employee name |
| `department` | `string` | Case-insensitive partial match on department |
| `category` | `string` | Exact match on expense category |
| `status` | `string` | Exact match: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED` |
| `dateFrom` | `ISO date string` | Filter expense dates from this date (inclusive) |
| `dateTo` | `ISO date string` | Filter expense dates up to this date (inclusive, end of day) |
| `amountMin` | `number` | Minimum amount filter |
| `amountMax` | `number` | Maximum amount filter |
| `sortBy` | `string` | One of: `voucherDate`, `expenseDate`, `amount`, `status`, `createdAt` |
| `sortOrder` | `string` | `asc` or `desc` (default: `desc`) |

---

## Assumptions Made During Development

1. **Local disk signature storage:** Signature images (both employee and director) are stored on the server's local filesystem at `backend/src/uploads/signatures/` using Multer's `diskStorage` engine and served as static files via Express. This is a development-appropriate simplification. In a production system, these would be stored in an object storage service (AWS S3, Cloudinary, or Supabase Storage) for durability, scalability, and CDN delivery.

2. **`SUBMITTED` vs `PENDING_APPROVAL` are distinct statuses:** The Prisma schema defines both `SUBMITTED` and `PENDING_APPROVAL` as separate enum values. In the current implementation, when an employee submits a voucher, it transitions directly from `DRAFT` → `PENDING_APPROVAL` (skipping `SUBMITTED`). The `SUBMITTED` status was retained in the enum for potential future use (e.g., a multi-stage review process) but is not set by any current route.

3. **Voucher number generation is sequential, not transactional:** Voucher numbers are generated in the format `VCH-YYYY-XXXXXX` by querying the most recent voucher for the current year and incrementing. Under very high concurrency (multiple simultaneous creates), there is a theoretical race condition where two vouchers could receive the same number. For this single-company use case, this was accepted; a production implementation would use a database sequence or advisory lock.

4. **Public registration endpoint:** There is no admin UI to create users. The `POST /api/auth/register` endpoint is public and accepts the `role` field directly in the request body. This is a deliberate developer convenience for the internship demo environment. In production, role assignment would be restricted to an admin action.

5. **Signature deletion removes the file from disk:** When a signature is deleted (employee removing theirs, or the system clearing one on rejection), the actual file is removed from the filesystem using `fs.unlinkSync`. The `try/catch` wrapping makes this best-effort — if the file is already missing, the database record is still cleared.

6. **Supabase connection pooler `connection_limit`:** The `DATABASE_URL` is configured with `connection_limit=2` because Supabase's free-tier session-mode pooler has a hard cap of 15 connections. During development with Nodemon hot-reloading, each restart could accumulate stale connections. This limit should be revisited and likely removed when deploying to a production environment with a proper connection pooler (e.g., PgBouncer in transaction mode).

7. **No "Submitted" intermediate state shown in UI:** The frontend `STATUS_META` map includes `SUBMITTED` as a displayable badge, but because the backend skips this state in the current workflow, users will not encounter it in practice.

---

## Known Limitations / Future Improvements

- **Local file storage:** Signature images are stored on the server's local disk. This means they are lost on server restart if using an ephemeral filesystem (e.g., Heroku, Railway free tier) and cannot scale horizontally. **Priority fix for production.**
- **No automated tests:** The codebase does not include unit or integration tests. All testing was done manually via the browser and API client during development.
- **No email notifications:** There are no email alerts when a voucher is submitted, approved, or rejected. Employees must check the app manually for status updates.
- **Public registration:** The `/api/auth/register` endpoint is open. In production, this should be moved behind an admin-only authenticated route.
- **No refresh token mechanism:** JWT tokens expire and the user is logged out. There is no silent token refresh — the user must log in again.
- **Voucher number race condition:** See Assumptions section. Not a practical issue for single-instance deployment but a known gap.
- **Category list is hardcoded on the frontend:** The list of expense categories (`Travel`, `Meals`, `Accommodation`, etc.) is a static array in the React components rather than being fetched from a configuration endpoint. Adding a category requires a code change.

---

## Folder Structure

```
voucher-management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data models, enums, and datasource config
│   │   └── migrations/            # Auto-generated Prisma migration history
│   ├── src/
│   │   ├── app.js                 # Express app setup: routes, middleware, static files
│   │   ├── server.js              # HTTP server entry point
│   │   ├── config/
│   │   │   └── db.js              # Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── voucher.controller.js  # Employee voucher operations
│   │   │   ├── director.controller.js
│   │   │   └── accounts.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js     # JWT verification
│   │   │   ├── role.middleware.js     # Role-based authorization
│   │   │   ├── upload.middleware.js   # Multer signature upload config
│   │   │   └── errorHandler.js        # Centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── voucher.routes.js
│   │   │   ├── director.routes.js
│   │   │   └── accounts.routes.js
│   │   ├── utils/
│   │   │   ├── generateVoucherNumber.js  # VCH-YYYY-XXXXXX auto-numbering
│   │   │   └── voucherFilters.js         # Shared search/filter/sort query builder
│   │   └── uploads/
│   │       └── signatures/           # Uploaded signature image files (gitignored)
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── App.jsx                  # Root router with all protected routes
    │   ├── main.jsx                 # React entry point
    │   ├── api/
    │   │   ├── axios.js             # Axios instance with JWT + error interceptors
    │   │   ├── auth.js
    │   │   ├── vouchers.js          # Employee API calls
    │   │   ├── director.js
    │   │   └── accounts.js
    │   ├── context/
    │   │   └── AuthContext.jsx      # Auth state, login/logout, role detection
    │   ├── components/
    │   │   └── TopBar.jsx           # Shared navigation bar (role-aware)
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx   # Role-based route guard
    │   └── pages/
    │       ├── auth/
    │       │   └── LoginPage.jsx
    │       ├── employee/
    │       │   ├── EmployeeDashboard.jsx
    │       │   ├── MyVouchers.jsx
    │       │   ├── CreateVoucher.jsx
    │       │   ├── EditVoucher.jsx
    │       │   ├── VoucherDetails.jsx
    │       │   └── employee.module.css  # Shared CSS module for all roles
    │       ├── director/
    │       │   ├── DirectorDashboard.jsx
    │       │   ├── DirectorPendingVouchers.jsx
    │       │   ├── DirectorVouchers.jsx
    │       │   └── DirectorVoucherDetail.jsx
    │       ├── accounts/
    │       │   ├── AccountsDashboard.jsx
    │       │   ├── AccountsVouchers.jsx
    │       │   └── AccountsVoucherDetail.jsx
    │       ├── NotFoundPage.jsx
    │       └── NotAuthorizedPage.jsx
    └── package.json
```

---

## Assumptions Made During Development

The assignment specification contained several points of ambiguity. Where the spec was unclear, a deliberate, documented decision was made rather than silently picking one interpretation.

### 1. Draft Vouchers Are Invisible to Director and Accounts Team

**Spec ambiguity:** Section 10 (Business Rules) states "The Director can view every voucher in the organization" with no explicit status restriction. However, Section 4 (Workflow) shows `DRAFT` as a pre-submission, employee-only working state, and Section 3.1 confirms employees can freely edit and delete vouchers while in `DRAFT`.

**Decision adopted:** `DRAFT` vouchers are treated as **private, unsubmitted employee working documents**. They are excluded from Director and Accounts Team visibility entirely. A voucher only becomes visible to those roles once the employee explicitly submits it (status transitions to `PENDING_APPROVAL`).

**Reasoning:**
- A draft has not entered the approval workflow — showing it to a Director would expose incomplete, uncommitted data.
- Allowing a Director to view drafts would create confusion: they might attempt to approve/reject something the employee hasn't finished or decided to discard.
- The Accounts team's role is financial record-keeping of *completed* transactions, not monitoring works-in-progress.
- This interpretation aligns with standard enterprise document lifecycle patterns (e.g., a draft purchase order is not visible to approvers until submitted).

**Implementation:**
- Backend: Both `GET /api/director/vouchers` and `GET /api/accounts/vouchers` have an explicit `status: { not: 'DRAFT' }` Prisma filter applied server-side — even if a frontend client tries to pass `?status=DRAFT`, the filter is overridden.
- Backend: The Accounts dashboard `totalVouchers` count excludes Drafts.
- Backend: The Director dashboard recent activity feed excludes Drafts.
- Frontend: The status filter dropdowns in Director "All Vouchers" and Accounts "All Vouchers" do not offer "Draft" as an option, since it can never be a valid result for those roles.

---

### 2. Submission Requires Signature

**Decision:** An employee cannot submit a voucher for approval until they have uploaded their signature. The submit button is disabled and a warning is shown if no signature is present.

**Reasoning:** The assignment spec showed signature as part of the physical form. Making it mandatory before submission enforces data completeness before the voucher enters the approval queue.

---

### 3. Amount Validation Cap

**Decision:** The expense amount is capped at ₹99,000 per voucher.

**Reasoning:** The spec did not specify a maximum amount. A practical upper-bound was set to prevent data entry errors (e.g., typing an extra zero) and to reflect realistic expense reimbursement limits for an internship-stage company workflow.

---

*Built by Afifa Shaikh as part of the Full Stack Developer.*
