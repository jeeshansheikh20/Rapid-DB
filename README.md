An automated platform that converts raw **CSV and Excel files into live, authenticated, production-ready RESTful CRUD APIs in seconds**.

---

### 1. High-Level Concept & Problem Solved
Manually building backend services, database tables, and CRUD endpoints for mock data, prototyping, or non-technical business spreadsheets usually takes hours. 

This application provides a **no-code / low-code bridge**:
1. You drag-and-drop a spreadsheet (`.csv`, `.xlsx`, `.xls`).
2. The engine parses the data and infers column types (text, numbers, booleans, timestamps).
3. It creates an isolated PostgreSQL table and bulk-loads the records.
4. It issues dual API keys (Admin `sk_...` & Read-only `pk_...`).
5. You instantly get interactive REST endpoints (`GET`, `POST`, `PUT`, `DELETE`) with built-in Swagger documentation.

---

### 2. Tech Stack & Dependencies
* **Framework**: [Next.js 15](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/package.json) (App Router, Node.js runtime) + React 19 + TypeScript.
* **Styling & UI**: Tailwind CSS, Radix UI primitives (`@radix-ui/react-*`), Lucide React icons, and `next-themes`.
* **Database**: PostgreSQL (hosted on Supabase) via the [`pg`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/lib/database.ts) connection pool.
* **Spreadsheet Parsing**: SheetJS (`xlsx`) for parsing CSVs and multi-format Excel workbooks.
* **API Documentation**: OpenAPI 3.0 specification with [Swagger UI](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/docs/page.tsx) (`swagger-ui-react`).
* **DevOps / Keep-Alive**: GitHub Actions workflow ([`.github/workflows/keep-alive.yml`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/.github/workflows/keep-alive.yml)) executing a keep-alive ping script ([`scripts/keep-alive.js`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/scripts/keep-alive.js)) to prevent Supabase's free-tier database from pausing.

---

### 3. Step-by-Step Architecture & User Flow

```mermaid
flowchart TD
    A[User uploads CSV / Excel] --> B[parseFile - SheetJS]
    B --> C[Infer Schema: Types & Nullability]
    C --> D[Data Table Editor - In-browser Preview & Edit]
    D --> E[Generate API / Database Provisioning]
    E --> F[PostgreSQL: Dynamic Table Created]
    E --> G[PostgreSQL: Batch Insert 500 rows/batch]
    E --> H[PostgreSQL: Metadata & Key Generation]
    H --> I[Dual API Keys: Admin sk_... & Read pk_...]
    I --> J[Live Dynamic Endpoints /api/data/:table]
    I --> K[Interactive Swagger UI /api/docs]
```

#### Step 1: Upload & File Parsing
* Component: [`components/upload/file-uploader.tsx`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/components/upload/file-uploader.tsx) uses `react-dropzone`.
* Route: [`app/api/preview/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/preview/route.ts)
* Logic: [`lib/file-parser.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/lib/file-parser.ts)
  * Uses SheetJS `read()` on array buffers.
  * Sanitizes column headers into valid SQL identifiers (lowercased, replaces special characters/spaces with underscores, handles naming collisions).
  * Automatically samples rows to infer types (`string`, `number`, `boolean`, `date`).

#### Step 2: Interactive Data Preview & Editing
* Component: [`components/upload/data-table-editor.tsx`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/components/upload/data-table-editor.tsx)
* Allows the user to inspect the parsed table in the browser, view column data types, edit cell values, add/remove rows, and review data before provisioning the database.

#### Step 3: Database Provisioning & Table Ingestion
* Route: [`app/api/generate/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/generate/route.ts) (and [`app/api/upload/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/upload/route.ts))
* Handled in [`lib/database.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/lib/database.ts):
  * **Dynamic Table Creation**: Generates a dedicated table name (e.g., `user_<file>_<uuid>`) with `id SERIAL PRIMARY KEY` and `created_at TIMESTAMP`.
  * **Batch Inserts**: Inserts records in batches of 500 with parameterized values to prevent hitting PostgreSQL's parameter limits.
  * **Metadata Tracking**: Stores project details, generated table names, expiration timestamp (24h default TTL), and API keys in the `_api_metadata` table.

#### Step 4: Authentication & Security
* Keys generated:
  * **Admin Key (`sk_...`)**: Required for write and delete operations (`POST`, `PUT`, `DELETE`).
  * **Public / Read Key (`pk_...`)**: Restricted to read operations (`GET`).
* Security checks:
  * Accepts keys via header (`x-api-key`) or query param (`?apiKey=...`).
  * Resource binding check: ensures the key presented belongs specifically to the requested table (`project.table_name === tableParam`), preventing cross-table access.
  * Strict identifier validation regex (`/^[a-z0-9_]+$/`) on table and column names to prevent SQL injection.

#### Step 5: Dynamic CRUD Endpoints
* **Collection Route**: [`app/api/data/[table]/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/data/[table]/route.ts)
  * `GET /api/data/[table]?apiKey=...&limit=100&offset=0`: Retrieves records with pagination.
  * `POST /api/data/[table]?apiKey=...`: Creates a new record (requires Admin key).
* **Item Route**: [`app/api/data/[table]/[id]/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/data/[table]/[id]/route.ts)
  * `GET /api/data/[table]/[id]?apiKey=...`: Fetches record by ID.
  * `PUT /api/data/[table]/[id]?apiKey=...`: Updates record fields (requires Admin key).
  * `DELETE /api/data/[table]/[id]?apiKey=...`: Deletes record (requires Admin key).

#### Step 6: Interactive Documentation
* Route: [`app/api/docs/page.tsx`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/docs/page.tsx)
* OpenAPI Spec: [`lib/swagger.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/lib/swagger.ts) and [`app/api/swagger/route.ts`](file:///c:/Users/lenov/OneDrive/Desktop/Placements/BAAs/app/api/swagger/route.ts)
* Embedded Swagger UI client allowing users to test API calls right in the browser using their generated keys.

---

### 4. Repository Directory Structure Summary

```
BAAs/
├── app/
│   ├── api/
│   │   ├── data/[table]/         # Dynamic CRUD routes (GET, POST, PUT, DELETE)
│   │   ├── docs/                 # Swagger UI interactive docs page
│   │   ├── generate/             # Creates table & metadata from parsed JSON
│   │   ├── preview/              # Parses uploaded file without committing to DB
│   │   ├── swagger/              # Serves OpenAPI JSON specification
│   │   └── upload/               # One-shot upload-and-generate route
│   ├── layout.tsx                # Root layout & providers
│   └── page.tsx                  # Landing page (hero, features, use cases, upload area)
├── components/
│   ├── api/                      # API endpoint cards & links display
│   ├── theme/                    # Dark/light mode theme toggling
│   ├── ui/                       # Radix UI + shadcn/ui components (button, card, dialog, etc.)
│   └── upload/                   # File uploader and data table spreadsheet editor
├── lib/
│   ├── auth.ts                   # API key validation utilities
│   ├── database.ts               # PG connection pool, dynamic DDL, batch insert, CRUD queries
│   ├── file-parser.ts            # SheetJS parser, schema inference, identifier sanitizer
│   ├── swagger.ts                # OpenAPI 3.0 specification definition
│   └── utils.ts                  # Tailwind class merging helper
├── scripts/
│   └── keep-alive.js             # Supabase ping script to avoid inactivity pause
└── .github/workflows/
    └── keep-alive.yml            # Bi-weekly cron job running keep-alive.js
```

### 5. Running the Project Locally
To run this project:
1. Ensure a PostgreSQL connection string is set in your `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```
2. Run `npm install` (or `pnpm install`).
3. Run `npm run dev` and open `http://localhost:3000`.
