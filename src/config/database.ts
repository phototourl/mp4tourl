/**
 * MySQL connection settings (same pattern as editstamp).
 * Set DB_* in `.env.local` / Dokploy Environment — do not commit secrets.
 */
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mp4tourl',
} as const;

export type DatabaseConfig = typeof databaseConfig;
