import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

type AppDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
	__ptuMysqlPool?: mysql.Pool;
	__ptuDb?: AppDb;
};

function getConfig() {
	const isDev = process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_DB === 'true';

	if (isDev) {
		// 开发环境：优先使用环境变量，回退到 localhost（需本地 .env 或 .env.local 配置）
		return {
			host: process.env.DB_HOST ?? 'localhost',
			port: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
			user: process.env.DB_USER ?? 'root',
			password: process.env.DB_PASSWORD ?? '',
			database: process.env.DB_NAME ?? 'mp4tourl',
		};
	}

	// 生产环境：必须提供所有凭据，不接受硬编码备用值
	const host = process.env.DB_HOST;
	const port = process.env.DB_PORT;
	const user = process.env.DB_USER;
	const password = process.env.DB_PASSWORD;
	const database = process.env.DB_NAME;

	if (!host || !port || !user || !database) {
		throw new Error(
			`[DB] Missing required environment variables for production database. ` +
				`Required: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME`
		);
	}

	return {
		host,
		port: Number.parseInt(port, 10),
		user,
		password: password ?? '',
		database,
	};
}

export async function getDb() {
	if (globalForDb.__ptuDb) return globalForDb.__ptuDb;

	const config = getConfig();
	// 仅开发收紧连接池，避免 HMR 打满远程 MySQL；生产用 mysql2 默认，不改行为
	const isDevRuntime = process.env.NODE_ENV === 'development';
	const client = isDevRuntime
		? mysql.createPool({
				...config,
				waitForConnections: true,
				connectionLimit: Number.parseInt(process.env.DB_POOL_SIZE ?? '2', 10),
				maxIdle: 2,
				idleTimeout: 60_000,
				enableKeepAlive: true,
				keepAliveInitialDelay: 0,
			})
		: mysql.createPool(config);

	console.log(`[DB] Connecting to ${config.host}:${config.port}/${config.database}`);

	globalForDb.__ptuMysqlPool = client;
	globalForDb.__ptuDb = drizzle(client, { schema, mode: 'default' });
	return globalForDb.__ptuDb;
}
