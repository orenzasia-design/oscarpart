import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const SEEDS_DIR = path.join(__dirname, '../../../database/seeds');

async function runSeed(filePath: string): Promise<void> {
  const sql    = fs.readFileSync(filePath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    logger.info(`✅ Seeded: ${path.basename(filePath)}`);
  } catch (err: unknown) {
    // Ignore duplicate key errors (re-running seeds)
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('duplicate') || msg.includes('unique')) {
      logger.warn(`⚠  Skipped (already seeded): ${path.basename(filePath)}`);
    } else {
      throw err;
    }
  } finally {
    client.release();
  }
}

async function seed(): Promise<void> {
  logger.info('Running database seeds...');

  try {
    // Run all seed files in order
    const files = fs.readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      await runSeed(path.join(SEEDS_DIR, file));
    }

    logger.info('✅ All seeds complete.');
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
