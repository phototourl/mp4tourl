import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
	out: './src/db/migrations',
	schema: './src/db/schema.ts',
	dialect: 'mysql',
	dbCredentials: {
		host: process.env.DB_HOST || '110.40.176.144',
		port: Number.parseInt(process.env.DB_PORT || '3306', 10),
		user: process.env.DB_USER || 'admin',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'phototourl',
	},
});
