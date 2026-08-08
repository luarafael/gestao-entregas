import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Prisma Migrate needs a direct Postgres connection (advisory locks fail via PgBouncer). */
function getMigrationDatabaseUrl(): string {
  const directUrl = process.env["DIRECT_URL"]?.trim();
  if (directUrl) return directUrl;

  const databaseUrl = process.env["DATABASE_URL"]?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ou DIRECT_URL é obrigatório para migrations");
  }

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
