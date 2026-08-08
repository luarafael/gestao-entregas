import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Usado só no `prisma generate` durante o Docker build (sem DATABASE_URL). */
const BUILD_PLACEHOLDER_URL =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

/** Prisma Migrate needs a direct Postgres connection (advisory locks fail via PgBouncer). */
function getMigrationDatabaseUrl(): string {
  const directUrl = process.env["DIRECT_URL"]?.trim();
  if (directUrl) return directUrl;

  const databaseUrl = process.env["DATABASE_URL"]?.trim();
  if (!databaseUrl) return BUILD_PLACEHOLDER_URL;

  // Neon: URL pooled (-pooler) não suporta pg_advisory_lock do migrate deploy
  if (databaseUrl.includes("-pooler.")) {
    return databaseUrl.replace("-pooler.", ".");
  }

  return databaseUrl;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
  seed: {
    command: "tsx prisma/seed.ts",
  },
});
