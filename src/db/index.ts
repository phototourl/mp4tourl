/**
 * Connect to MySQL (mysql2 pool + Drizzle) — aligned with editstamp.
 */
import { databaseConfig } from '@/config/database';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import * as schema from './schema';

export type Mp4tourlDb = MySql2Database<typeof schema>;

declare global {
  var __mp4tourlDbPool: Pool | undefined;
  var __mp4tourlDrizzleDb: Mp4tourlDb | undefined;
  var __mp4tourlLiveDb: Mp4tourlDb | undefined;
}

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as NodeJS.ErrnoException).code;
  const message = String((error as Error).message ?? '');
  return (
    code === 'ECONNRESET' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'EPIPE' ||
    message.includes('Pool is closed')
  );
}

/** Drop cached pool so the next query opens fresh TCP connections. */
export function resetDbPool(): void {
  const pool = globalThis.__mp4tourlDbPool;
  globalThis.__mp4tourlDbPool = undefined;
  globalThis.__mp4tourlDrizzleDb = undefined;
  if (pool) {
    void pool.end().catch(() => {});
  }
}

function createPool(): Pool {
  const pool = mysql.createPool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    connectTimeout: 10_000,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    /** Recycle idle sockets before remote MySQL / firewall drops them. */
    idleTimeout: 60_000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
  });

  pool.on('connection', (connection) => {
    connection.on('error', (err) => {
      console.error('[db] connection error:', err.code ?? err.message);
    });
  });

  return pool;
}

function getDbInternal(): Mp4tourlDb {
  if (globalThis.__mp4tourlDrizzleDb) {
    return globalThis.__mp4tourlDrizzleDb;
  }

  const pool = globalThis.__mp4tourlDbPool ?? createPool();
  globalThis.__mp4tourlDbPool = pool;

  const db = drizzle(pool, {
    schema,
    mode: 'default',
  });
  globalThis.__mp4tourlDrizzleDb = db;

  return db;
}

/**
 * Stable Drizzle handle that always forwards to the current pool.
 * Better Auth captures the DB once at module init; after resetDbPool()
 * the captured instance would otherwise keep a closed pool.
 */
export function getLiveDb(): Mp4tourlDb {
  if (globalThis.__mp4tourlLiveDb) {
    return globalThis.__mp4tourlLiveDb;
  }

  const liveDb = new Proxy({} as Mp4tourlDb, {
    get(_target, prop, _receiver) {
      const db = getDbInternal();
      const value = Reflect.get(db as object, prop, db);
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(db)
        : value;
    },
  });

  globalThis.__mp4tourlLiveDb = liveDb;
  return liveDb;
}

export async function getDb(): Promise<Mp4tourlDb> {
  return getDbInternal();
}

/** Run a DB operation; on stale socket, reset pool once and retry. */
export async function withDb<T>(
  fn: (db: Mp4tourlDb) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fn(getDbInternal());
    } catch (error) {
      if (attempt === 0 && isConnectionError(error)) {
        console.warn(
          '[db] connection lost, resetting pool and retrying once:',
          (error as NodeJS.ErrnoException).code ??
            (error as Error).message ??
            error
        );
        resetDbPool();
        continue;
      }
      throw error;
    }
  }

  throw new Error('[db] unreachable');
}
