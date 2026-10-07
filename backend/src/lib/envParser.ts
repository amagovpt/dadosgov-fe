import { z } from 'zod';

const envSchema = z.object({
  //GENERAL
  NODE_ENV: z
    .enum(['production', 'development'])
    .optional()
    .default('development'),
  PORT: z.coerce.number().optional().default(3333),
  FRONTEND_ORIGIN: z.string(),
  LOG_DIR: z.string().optional().default('./logs'),

  //CMS
  CMS_URL: z.string().default(''),
  API_KEY: z.string().default(''),
  CLIENT_ID: z.string().default(''),
  CLIENT_SECRET: z.string().default(''),
  APP_NAME: z.string().default(''),
  SCHEMA_POLL_INTERVAL_MS: z.coerce.number().optional().default(300_000),
  SCHEMA_FETCH_RETRIES: z.coerce.number().optional().default(5),
  SCHEMA_FETCH_RETRY_DELAY_MS: z.coerce.number().optional().default(1_000),

  //CACHE
  CACHE_ENABLED: z.string().optional().default("true").transform(val => val !== "false"),
  // Analytical data only changes when the ETL runs, so a long TTL is safe.
  CACHE_TTL_MS: z.coerce.number().default(300_000),
  // Total cache budget. Baseline RSS of the stitched gateway is ~142MB and the
  // pod limit is 512Mi, so this must stay well below the remaining headroom.
  CACHE_MAX_BYTES: z.coerce.number().default(50_331_648),
  // Per-entry ceiling. 98.4% of responses are under 100KB, but a few reach
  // 26MB; caching one of those would evict everything else.
  CACHE_MAX_ENTRY_BYTES: z.coerce.number().default(524_288),

  //DB ANALYTICAL
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string().default("postgres"),
  DB_NAME: z.string().default("final_db"),

  //DB APP
  DB_APP_NAME: z.string().default("appdb"),

});

/**
 * Parsed environment variables. Use this to access environment variables.
 */
export const envParser = envSchema.parse(process.env);
