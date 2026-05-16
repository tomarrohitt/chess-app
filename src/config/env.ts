import "dotenv/config";
import { z, ZodType } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:password@localhost:5432/chess"),

  BETTER_AUTH_URL: z.string().default("http://localhost:7860"),
  CLOUDINARY_URL: z.string().default(""),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
});

export function validateEnv<T>(schema: ZodType<T>): T {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as T;
  }

  const parsed = schema.safeParse(process.env);

  if (parsed.error) {
    console.error("Invalid environment variables:");
    console.log({ errors: parsed.error });
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv(schema);
export type EnvConfig = z.infer<typeof schema>;
