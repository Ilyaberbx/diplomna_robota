import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

export const appConfigSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  databaseUrl: z.string().url(),
  authJwtSecret: z.string().min(1),
  authJwtTtl: z.string().min(1).default('7d'),
  storageDir: z.string().min(1).default('./.storage'),
  corsAllowedOrigins: z
    .string()
    .default('http://localhost:5173')
    .transform((s) => s.split(',').map((o) => o.trim())),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const loadAppConfig = (env: NodeJS.ProcessEnv): AppConfig =>
  appConfigSchema.parse({
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    authJwtSecret: env.AUTH_JWT_SECRET,
    authJwtTtl: env.AUTH_JWT_TTL,
    storageDir: env.STORAGE_DIR,
    corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS,
  });
