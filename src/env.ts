import * as dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  FARCASTER_API_KEY: z.string().trim().min(1),
  FARCASTER_SIGNER_UUID: z.string().trim().min(1),
  FARCASTER_CHANNEL_ID: z.string().trim().min(1),
  FARCASTER_REPLY_TO_CAST_HASH: z.string().trim().min(1),
  ENABLE_JOBS: z
    .string()
    .trim()
    .default("true")
    .transform((v) => v === "true"),
  PORT: z
    .string()
    .trim()
    .default("3000")
    .transform((v) => parseInt(v)),
  BUILD_API_URL: z.string().url().trim().min(1),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined))
    .optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  WEBHOOK_KEY: z.string().trim().min(1),
  REMINDER_CRON: z.string().trim().optional().default("0 0 * * 3"),
  WEEKLY_STATS_CRON: z.string().trim().optional().default("0 0 * * 0"),
  XMTP_ENV: z.enum(["production", "dev"]).default("dev"),
  // BUILDBOT
  BUILDBOT_WARPCAST_API_KEY: z.string(),
  BUILDBOT_WEBHOOK_NAME: z.string().trim().min(1),
  BUILDBOT_WEBHOOK_TARGET_BASE_URL: z.string().url().trim().min(1),
  BUILDBOT_FARCASTER_FID: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined)),
  BUILDBOT_XMTP_PRIVATE_KEY: z.string().trim().min(1),
  BUILD_SHARED_SECRET: z.string().trim().min(1),
  // TALENTBOT
  TALENTBOT_WARPCAST_API_KEY: z.string(),
  TALENTBOT_XMTP_PRIVATE_KEY: z.string().trim().min(1),
});

const { data, success, error } = envSchema.safeParse(process.env);

if (!success) {
  console.error(
    `An error has occurred while parsing environment variables:${error.errors.map(
      (e) => ` ${e.path.join(".")} is ${e.message}`
    )}`
  );
  process.exit(1);
}

export type EnvSchemaType = z.infer<typeof envSchema>;
export const env = data;
