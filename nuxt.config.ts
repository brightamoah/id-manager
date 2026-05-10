// https://nuxt.com/docs/api/configuration/nuxt-config

import { env } from "./app/lib/env";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxt/eslint",
    "nuxt-auth-utils",
  ],

  css: [
    "~/assets/css/main.css",
  ],

  experimental: {
    typedPages: true,
    typescriptPlugin: true,
    viteEnvironmentApi: true,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  runtimeConfig: {
    dbUrl: env.NUXT_DB_URL,
    dbAuthToken: env.NUXT_DB_AUTH_TOKEN,
    oauth: {
      github: {
        clientId: env.NUXT_OAUTH_GITHUB_CLIENT_ID,
        clientSecret: env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
        callbackUrl: env.NUXT_OAUTH_GITHUB_CALLBACK_URL,
      },
      google: {
        clientId: env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
        callbackUrl: env.NUXT_OAUTH_GOOGLE_CALLBACK_URL,
      },
    },

    session: {
      password: env.NUXT_SESSION_PASSWORD,
      name: env.NUXT_SESSION_NAME,
      cookie: {
        maxAge: 60 * 60 * 24 * 1, // 1 day
      },
    },
  },

});
