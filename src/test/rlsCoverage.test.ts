import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

// Regression coverage for #1525: the frontend embeds the Supabase anon key
// in the production bundle, which is fine *only* if every table reachable
// through `supabase.from(...)` has Row Level Security enabled. RLS is
// already turned on for every table currently queried from the frontend
// (see the migrations under supabase/migrations/), but there was no
// automated check preventing a future PR from adding a new
// `supabase.from("some_new_table")` call without a matching
// `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` migration. This test closes
// that gap statically, without needing a live database in CI.

const ROOT = resolve(__dirname, "../..");
const SRC_DIR = resolve(ROOT, "src");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");

// Tables that are intentionally public / have no user-owned rows, or that
// are views backed by an RLS-protected base table. Extend this list with a
// comment explaining why whenever a genuinely public table is added.
const RLS_EXEMPT_TABLES = new Set<string>([]);

function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function findQueriedTables(): Set<string> {
  const files = collectFiles(SRC_DIR, [".ts", ".tsx"]);
  const tables = new Set<string>();
  // Matches `.from("table_name")` / `.from('table_name')` on the Supabase
  // client (deliberately not scoped to a specific identifier so it also
  // catches destructured/aliased clients).
  const fromCallPattern = /\.from\(\s*["']([a-zA-Z0-9_]+)["']\s*\)/g;

  for (const file of files) {
    if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
    const content = readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = fromCallPattern.exec(content)) !== null) {
      tables.add(match[1]);
    }
  }
  return tables;
}

function findTablesWithRlsEnabled(): Set<string> {
  const files = collectFiles(MIGRATIONS_DIR, [".sql"]);
  const tables = new Set<string>();
  // Matches `ALTER TABLE [public.]table_name ENABLE ROW LEVEL SECURITY`,
  // tolerating quoted identifiers and any schema prefix.
  const rlsPattern =
    /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:"?[a-zA-Z0-9_]+"?\.)?"?([a-zA-Z0-9_]+)"?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    let match: RegExpExecArray | null;
    while ((match = rlsPattern.exec(content)) !== null) {
      tables.add(match[1]);
    }
  }
  return tables;
}

describe("Row Level Security coverage (#1525)", () => {
  it("has an ENABLE ROW LEVEL SECURITY migration for every table queried from the frontend", () => {
    const queriedTables = findQueriedTables();
    const rlsEnabledTables = findTablesWithRlsEnabled();

    const missingRls = [...queriedTables]
      .filter((table) => !RLS_EXEMPT_TABLES.has(table))
      .filter((table) => !rlsEnabledTables.has(table))
      .sort();

    expect(
      missingRls,
      `The following tables are queried directly from the frontend (which embeds ` +
        `the public Supabase anon key) but have no "ENABLE ROW LEVEL SECURITY" ` +
        `migration: ${missingRls.join(", ")}. Add RLS policies for them, or add ` +
        `them to RLS_EXEMPT_TABLES with a comment explaining why they're safe ` +
        `to leave open.`,
    ).toEqual([]);
  });

  it("sanity check: the frontend actually queries a non-trivial number of tables", () => {
    // Guards against the scanner silently finding zero matches due to a
    // future refactor of how the Supabase client is imported/aliased.
    expect(findQueriedTables().size).toBeGreaterThan(5);
  });
});
