import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile: string): Promise<void> {
  try {
    const migrationPath = join(process.cwd(), "drizzle", "migrations", migrationFile);
    const sql = readFileSync(migrationPath, "utf-8");

    console.log(`🔄 Running migration: ${migrationFile}`);
    console.log(`📝 SQL:\n${sql}\n`);

    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error(`❌ Migration failed:`, error);
      process.exit(1);
    }

    console.log(`✅ Migration completed successfully!`);
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error("Usage: tsx scripts/run-single-migration.ts <migration-file>");
  process.exit(1);
}

runMigration(migrationFile);
