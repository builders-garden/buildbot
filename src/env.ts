import * as dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  FARCASTER_API_KEY: z.string().trim().min(1),
  FARCASTER_SIGNER_UUID: z.string().trim().min(1),
  FARCASTER_CHANNEL_ID: z.string().trim().min(1),
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
  WARPCAST_API_KEY: z.string(),
  WEBHOOK_KEY: z.string().trim().min(1),
  REMINDER_CRON: z.string().trim().optional().default("0 0 * * 3"),
  WEEKLY_STATS_CRON: z.string().trim().optional().default("0 0 * * 0"),
  XMTP_ENV: z.enum(["production", "dev"]).default("dev"),
  XMTP_PRIVATE_KEY: z.string().trim().min(1),
});

const { data, success } = envSchema.safeParse(process.env);

if (!success) {
  throw new Error("There is an error with the environment variables.");
}

export type EnvSchemaType = z.infer<typeof envSchema>;
export const env = data;
