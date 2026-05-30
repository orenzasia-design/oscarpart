import { Pool, PoolConfig } from 'pg';
import logger from './logger';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || undefined,
  host:     process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port:     process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'oscarpart'),
  user:     process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'oscarpart_user'),
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  min:      parseInt(process.env.DB_POOL_MIN || '2'),
  max:      parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const db = new Pool(poolConfig);

db.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

db.on('error', (err: Error) => {
  logger.error('PostgreSQL pool error:', err);
  // Removed process.exit(1) — pool errors should not kill the server
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT NOW() AS time, version() AS pg_version');
    logger.info(`Database connected: PostgreSQL at ${result.rows[0].time}`);
    client.release();
  } catch (err) {
    logger.error('Failed to connect to database:', err);
    throw err;
  }
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const result = await db.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { duration, text: text.substring(0, 200) });
    }
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (err) {
    logger.error('Database query error', { text: text.substring(0, 200), params, err });
    throw err;
  }
}

export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default db;