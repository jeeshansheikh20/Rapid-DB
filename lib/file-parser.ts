import { read, utils } from "xlsx";

export interface ColumnSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  nullable: boolean;
}

export interface DataSchema {
  fileName: string; // Added this to track original name
  tableName: string; // Suggested table name
  columns: ColumnSchema[];
  sampleData: Record<string, any>[];
  allData: Record<string, any>[];
}

/**
 * Helper: Detect the type of a single value.
 * Strict order: boolean -> number -> date -> string
 */
function detectType(value: any): "string" | "number" | "boolean" | "date" {
  if (value === null || value === undefined || value === "") return "string"; // Will handle nulls later

  // 1. Boolean
  if (typeof value === "boolean") return "boolean";
  const lower = String(value).toLowerCase();
  if (lower === "true" || lower === "false") return "boolean";

  // 2. Number (Handle "123" and 123)
  if (!isNaN(Number(value)) && String(value).trim() !== "") return "number";

  // 3. Date (Heuristic)
  const dateValue = new Date(value);
  if (!isNaN(dateValue.getTime()) && String(value).length > 5) {
    // Avoid treating "1" or "2023" as dates immediately if they look like numbers
    // But since we passed the number check above, this is likely a date string.
    return "date";
  }

  // 4. Fallback
  return "string";
}

/**
 * Helper: Resolve conflicting types in a column.
 * If a column has mixed types (e.g. Number + String), it must be String.
 */
function resolveColumnType(types: Set<string>): "string" | "number" | "boolean" | "date" {
  if (types.has("string")) return "string"; // Safety net: if any string exists, column is text
  if (types.has("date") && types.has("number")) return "string"; // Dates mixed with numbers -> text
  if (types.has("date")) return "date";
  if (types.has("number")) return "number";
  if (types.has("boolean")) return "boolean";
  return "string";
}

/**
 * Main Schema Inference
 */
function inferSchema(data: Record<string, any>[]): ColumnSchema[] {
  if (data.length === 0) return [];

  const headerKeys = Object.keys(data[0]);

  return headerKeys.map((columnName) => {
    const typesFound = new Set<string>();
    let nullCount = 0;

    // Scan up to 100 rows for performance (scanning 50k rows is too slow)
    const sampleLimit = Math.min(data.length, 100);

    for (let i = 0; i < sampleLimit; i++) {
      const value = data[i][columnName];
      if (value === null || value === undefined || value === "") {
        nullCount++;
      } else {
        typesFound.add(detectType(value));
      }
    }

    // Determine final type for the SQL column
    const finalType = resolveColumnType(typesFound);

    return {
      name: columnName,
      type: finalType,
      nullable: nullCount > 0,
    };
  });
}

/**
 * Helper: Sanitize a header string into a valid DB identifier.
 * Trims whitespace, lowercases, replaces runs of non-alphanumeric
 * characters with a single underscore, and strips leading/trailing underscores.
 * Throws if the result is empty (e.g. a header that is only special characters).
 */
function sanitizeColumnName(name: string): string {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!sanitized) {
    throw new Error(`Column header "${name}" could not be converted to a valid identifier. Headers must contain at least one alphanumeric character.`);
  }
  return sanitized;
}

/**
 * Universal Parser (CSV + Excel) via SheetJS
 */
export async function parseFile(file: File): Promise<DataSchema> {
  const buffer = await file.arrayBuffer();
  
  // SheetJS 'read' works for CSVs too if passed as a buffer! 
  // It handles quoted strings ("Doe, John") correctly.
  const workbook = read(buffer, { type: "array" });
  
  // Grab first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const rawData: Record<string, any>[] = utils.sheet_to_json(worksheet, {
    defval: null, // Set empty cells to null
    raw: false,   // Parse everything as strings first to avoid excel weirdness, or true for auto
    dateNF: 'yyyy-mm-dd' // Normalize dates
  });

  if (rawData.length === 0) {
    throw new Error("File is empty or could not be parsed.");
  }

  // Sanitize header keys so they are valid DB identifiers (no spaces, hyphens, etc.)
  // rawData is non-empty at this point (checked above).
  const originalKeys = Object.keys(rawData[0]);
  const keyMap: Record<string, string> = {};
  const usedNames = new Set<string>();
  for (const key of originalKeys) {
    let sanitized = sanitizeColumnName(key);
    // Resolve collisions (e.g. "User ID" and "User-ID" both → "user_id")
    if (usedNames.has(sanitized)) {
      let suffix = 2;
      while (usedNames.has(`${sanitized}_${suffix}`)) suffix++;
      sanitized = `${sanitized}_${suffix}`;
    }
    usedNames.add(sanitized);
    keyMap[key] = sanitized;
  }
  const sanitizedData = rawData.map((row) => {
    const sanitizedRow: Record<string, any> = {};
    for (const key of originalKeys) {
      sanitizedRow[keyMap[key]] = row[key];
    }
    return sanitizedRow;
  });

  const columns = inferSchema(sanitizedData);
  const sampleData = sanitizedData.slice(0, 5);
  
  // Clean up table name (remove extension, special chars)
  const cleanName = file.name.split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

  return {
    fileName: file.name,
    tableName: cleanName,
    columns,
    sampleData,
    allData: sanitizedData,
  };
}