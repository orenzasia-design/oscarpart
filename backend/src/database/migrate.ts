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

const SCHEMA_DIR = path.join(__dirname, '../../../database');

async function runFile(filePath: string): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    logger.info(`✅ Executed: ${path.basename(filePath)}`);
  } finally {
    client.release();
  }
}

async function migrate(): Promise<void> {
  logger.info('Running database migrations...');

  try {
    await runFile(path.join(SCHEMA_DIR, 'schema.sql'));
    await runFile(path.join(SCHEMA_DIR, 'indexes.sql'));
    logger.info('✅ Migrations complete.');
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
