import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For migrations only
export const migrationClient = postgres(connectionString, {
  prepare: false, // Required for Supabase Transaction pool mode
  max: 1,
});

// Singleton pattern for runtime queries to avoid connection exhaustion
// especially important in development with hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __db: PostgresJsDatabase<typeof schema> | undefined;
  // eslint-disable-next-line no-var
  var __queryClient: ReturnType<typeof postgres> | undefined;
}

let queryClient: ReturnType<typeof postgres>;
let db: PostgresJsDatabase<typeof schema>;

if (process.env.NODE_ENV === 'production') {
  // Production: create new connection with pooling
  queryClient = postgres(connectionString, {
    prepare: false, // Required for Supabase Transaction pool mode
    max: 10, // Max 10 connections in pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    max_lifetime: 60 * 30, // Close connections after 30 minutes
    connect_timeout: 10, // 10 second connection timeout
    statement_timeout: 10000, // 10 second statement timeout
    fetch_types: false, // Disable fetching types from DB (performance)
  });
  db = drizzle(queryClient, { schema });
} else {
  // Development: use singleton to avoid connection exhaustion with hot reloading
  if (!global.__queryClient) {
    global.__queryClient = postgres(connectionString, {
      prepare: false, // Required for Supabase Transaction pool mode
      max: 3, // Increase to 3 connections in development to prevent exhaustion
      idle_timeout: 20,
      connect_timeout: 30, // 30 second connection timeout (shared pooler can be slower)
      statement_timeout: 10000, // 10 second statement timeout
      fetch_types: false, // Disable fetching types from DB (performance)
    });
  }
  queryClient = global.__queryClient;

  if (!global.__db) {
    global.__db = drizzle(queryClient, { schema });
  }
  db = global.__db;
}

export { db };















