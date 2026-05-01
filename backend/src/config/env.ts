console.log("🚀 Starting backend initialization...");
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

let parsedEnv;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error: any) {
  if (error instanceof z.ZodError) {
    console.error("❌ Environment validation failed:");
    error.issues.forEach((issue: any) => {
      console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    });
  } else {
    console.error("❌ Failed to parse environment variables:", error);
  }
  process.exit(1);
}

export const env = parsedEnv!;
