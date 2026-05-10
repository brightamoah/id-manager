import { drizzle } from "drizzle-orm/libsql";
import { relations } from "../db/schema/relations";

export function useDB() {
  const runtimeConfig = useRuntimeConfig();

  const db = drizzle({
    connection: {
      url: runtimeConfig.dbUrl,
      authToken: runtimeConfig.dbAuthToken,
    },
    relations,
    casing: "camelCase",
  });

  if (!db)
    throw new Error("Database not initialized");

  return { db };
}
