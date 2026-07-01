import { Pool } from "pg";
import type { ColumnSchema } from "./file-parser";

// 1. FIX CONNECTION POOLING (Prevents crashing in Dev/Serverless)
let pool: Pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Limit connections per lambda
    idleTimeoutMillis: 30000,
  });
}
pool = global.pool;

// Add this type to global scope to prevent TS errors
declare global {
  var pool: Pool | undefined;
}

/* ---------------- helpers ---------------- */

// 2. SECURITY: Validate Identifiers to prevent SQL Injection
function validateIdentifier(name: string) {
  if (!/^[a-z0-9_]+$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}. Only lowercase a-z, 0-9, and _ allowed.`);
  }
  return `"${name}"`; // safe to wrap in quotes now
}

function pgType(type: string) {
  if (type === "number") return "DOUBLE PRECISION";
  if (type === "boolean") return "BOOLEAN";
  if (type === "date") return "TIMESTAMP";
  return "TEXT";
}

/* ---------------- schema ---------------- */

// In lib/database.ts

export async function createTable(table: string, columns: ColumnSchema[]) {
  const safeTable = validateIdentifier(table);
  
  // 1. FIX: Filter out system columns to prevent duplicates
  // We want to use OUR 'id' and 'created_at' definitions, not the file's.
  const systemColumns = ["id", "created_at"];
  const userColumns = columns.filter(c => !systemColumns.includes(c.name.toLowerCase()));

  // Create column definitions
  const cols = userColumns
    .map((c) => `${validateIdentifier(c.name)} ${pgType(c.type)}`)
    .join(",");

  // Create the Data Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${safeTable} (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      ${cols}
    )
  `);
}

// NEW: Create the Metadata Table (Run this once or handle via migration)
export async function initMetadataTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _api_metadata (
      id UUID PRIMARY KEY,
      original_name TEXT,
      table_name TEXT UNIQUE,
      admin_key TEXT,
      read_key TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/* ---------------- inserts ---------------- */

// 3. PERFORMANCE: Batch Insert (1 Query instead of 1000)
export async function insertData(table: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const safeTable = validateIdentifier(table);

  const keys = Object.keys(rows[0]);
  const columns = keys.map(k => validateIdentifier(k)).join(",");

  // Construct the ($1, $2), ($3, $4) string dynamically
  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((row, rowIndex) => {
    const rowPlaceholders: string[] = [];
    keys.forEach((key, colIndex) => {
      // Calculate strict parameter index: $1, $2, $3...
      const paramIndex = (rowIndex * keys.length) + (colIndex + 1);
      rowPlaceholders.push(`$${paramIndex}`);
      values.push(row[key]);
    });
    placeholders.push(`(${rowPlaceholders.join(",")})`);
  });

  const query = `
    INSERT INTO ${safeTable} (${columns})
    VALUES ${placeholders.join(",")}
  `;

  await pool.query(query, values);
}

/* ---------------- metadata & keys ---------------- */

export async function saveApiMetadata(data: {
  id: string; // uuid
  originalName: string;
  tableName: string;
  adminKey: string;
  readKey: string;
  expiresAt: Date;
}) {
  await initMetadataTable(); // Ensure table exists
  
  await pool.query(
    `INSERT INTO _api_metadata (id, original_name, table_name, admin_key, read_key, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.id, data.originalName, data.tableName, data.adminKey, data.readKey, data.expiresAt]
  );
}

export async function getProjectByApiKey(apiKey: string) {
  // Check if it's an Admin Key OR a Read Key
  const { rows } = await pool.query(
    `SELECT * FROM _api_metadata 
     WHERE admin_key = $1 OR read_key = $1`,
    [apiKey]
  );
  return rows[0] ?? null;
}

/* ---------------- reads (Dynamic API) ---------------- */

export async function getRecords(
  table: string,
  limit = 100,
  offset = 0
) {
  const safeTable = validateIdentifier(table);
  const { rows } = await pool.query(
    `SELECT * FROM ${safeTable} ORDER BY id LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export async function getRecordById(table: string, id: number) {
  const safeTable = validateIdentifier(table);
  const { rows } = await pool.query(
    `SELECT * FROM ${safeTable} WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/* ---------------- writes (Dynamic API) ---------------- */

export async function createRecord(table: string, data: Record<string, any>) {
  const safeTable = validateIdentifier(table);
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const cols = keys.map(k => validateIdentifier(k)).join(",");
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(",");

  const { rows } = await pool.query(
    `INSERT INTO ${safeTable} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteRecord(table: string, id: number) {
  const safeTable = validateIdentifier(table);
  const res = await pool.query(`DELETE FROM ${safeTable} WHERE id = $1`, [id]);
  return res.rowCount === 1;
}

export async function updateRecord(
  table: string,
  id: number,
  data: Record<string, any>
) {
  const safeTable = validateIdentifier(table);
  const keys = Object.keys(data);
  
  // If no data to update, return null or the existing record
  if (keys.length === 0) return null;

  const values = Object.values(data);
  
  // Create string like: "name" = $1, "email" = $2
  const setClause = keys
    .map((k, i) => `${validateIdentifier(k)} = $${i + 1}`)
    .join(", ");

  const { rows } = await pool.query(
    `UPDATE ${safeTable} 
     SET ${setClause} 
     WHERE id = $${keys.length + 1} 
     RETURNING *`,
    [...values, id] // id is the last parameter
  );

  return rows[0] ?? null;
}