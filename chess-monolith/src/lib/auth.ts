import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../infrastructure/db/db";
import { v7 as uuidv7 } from "uuid";
import { authHooks } from "./utils/auth-hooks";
import { env } from "@/config/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [env.CLIENT_URL],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 1,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      wins: {
        type: "number",
        defaultValue: 0,
      },
      losses: {
        type: "number",
        defaultValue: 0,
      },
      draws: {
        type: "number",
        defaultValue: 0,
      },
      rating: {
        type: "number",
        defaultValue: 1000,
      },
    },
  },
  hooks: authHooks,

  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
  // socialProviders: {
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID as string,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  //   },
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID as string,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  //   },
  // },
});
