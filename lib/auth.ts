import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Build the base URL from whatever environment we're running in. This makes
// the same code work in production, Vercel previews, and the v0 preview iframe.
const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL) || undefined

// Accumulate every origin Better Auth should trust. Dropping any of these
// breaks auth in that environment.
const trustedOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
].filter((v): v is string => Boolean(v))

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Welcome email is triggered from the signup action instead
          // to avoid bundling server-only modules in client code
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "buyer",
        input: true,
      },
      profileComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  advanced: {
    // The v0 preview renders the app inside a cross-site iframe. Without these
    // attributes the browser silently drops the session cookie.
    ...(process.env.NODE_ENV === "development"
      ? { defaultCookieAttributes: { sameSite: "none", secure: true } }
      : {}),
  },
})
