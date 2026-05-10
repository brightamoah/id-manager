import { defineConfig } from "drizzle-kit";
import { env } from "./app/lib/env";

export default defineConfig({
  out: "./server/db/migrations",
  schema: "./server/db/schema/index.ts",
  dialect: "turso",
  dbCredentials: {
    url: env.NUXT_DB_URL,
    authToken: env.NUXT_DB_AUTH_TOKEN,
  },
});
