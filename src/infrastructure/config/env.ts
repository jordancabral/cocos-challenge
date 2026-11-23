import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type AppEnv = z.infer<typeof schema>;

export function loadEnv(
  source: NodeJS.ProcessEnv = process.env,
  envPath?: string,
): AppEnv {
  if (source === process.env || envPath !== undefined) {
    loadDotEnv({
      path: envPath ?? '.env',
      processEnv: source,
      quiet: true,
    });
  }
  return schema.parse(source);
}
