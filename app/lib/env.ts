/* eslint-disable node/prefer-global/process */
import * as z from "zod";

import tryParseEnv from "./tryParseEnv";

const EnvSchema = z.object({
  NUXT_DB_URL: z.string("DB_URL is required"),
  NUXT_DB_AUTH_TOKEN: z.string("DB_AUTH_TOKEN is required"),
  NUXT_SESSION_PASSWORD: z.string("SESSION_PASSWORD is required").min(32, "SESSION_PASSWORD must be at least 32 characters long"),
  NUXT_OAUTH_GITHUB_CLIENT_ID: z.string("OAUTH_GITHUB_CLIENT_ID is required"),
  NUXT_OAUTH_GITHUB_CLIENT_SECRET: z.string("OAUTH_GITHUB_CLIENT_SECRET is required"),
  NUXT_OAUTH_GITHUB_CALLBACK_URL: z.string("OAUTH_GITHUB_CALLBACK_URL is required"),
  NUXT_SESSION_NAME: z.string("SESSION_NAME is required"),
  NUXT_OAUTH_GOOGLE_CLIENT_ID: z.string("OAUTH_GOOGLE_CLIENT_ID is required"),
  NUXT_OAUTH_GOOGLE_CLIENT_SECRET: z.string("OAUTH_GOOGLE_CLIENT_SECRET is required"),
  NUXT_OAUTH_GOOGLE_CALLBACK_URL: z.string("OAUTH_GOOGLE_CALLBACK_URL is required"),
});

tryParseEnv(EnvSchema);

export const env = EnvSchema.parse(process.env);
