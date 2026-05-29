/**
 * OSCARPART — Superadmin Setup Script
 *
 * Two modes:
 *   Interactive: npx ts-node src/scripts/setup-admin.ts
 *   Non-interactive (Docker/CI): set env vars and run
 *     ADMIN_EMAIL=admin@oscarpart.id ADMIN_PASSWORD=xxx ADMIN_NAME="Admin" npx ts-node src/scripts/setup-admin.ts
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import readline from 'readline';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'oscarpart',
  user:     process.env.DB_USER     || 'oscarpart_user',
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function prompt(question: string, defaultVal: string = ''): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer || defaultVal);
    });
  });
}

function validatePassword(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8)              errors.push('Minimal 8 karakter');
  if (!/[A-Z]/.test(pw))          errors.push('Minimal 1 huruf kapital');
  if (!/[0-9]/.test(pw))          errors.push('Minimal 1 angka');
  if (!/[^A-Za-z0-9]/.test(pw))   errors.push('Minimal 1 simbol (!@#$%)');
  return errors;
}

async function setup(): Promise<void> {
  // ── Detect interactive vs env-var mode ──────────────────────
  const envEmail    = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;
  const envName     = process.env.ADMIN_NAME;
  const isNonInteractive = !!(envEmail && envPassword);

  let email:    string;
  let password: string;
  let fullName: string;

  if (isNonInteractive) {
    console.log('🔧 OSCARPART Superadmin Setup (non-interactive mode)\n');
    email    = envEmail!;
    password = envPassword!;
    fullName = envName || 'OSCARPART Administrator';

    const errs = validatePassword(password);
    if (errs.length > 0) {
      console.error('❌ Password tidak memenuhi syarat:');
      errs.forEach((e) => console.error(`   - ${e}`));
      process.exit(1);
    }
  } else {
    console.log('\n🔧 OSCARPART Superadmin Setup\n');
    console.log('Tips: Jalankan dengan env vars untuk mode non-interaktif:');
    console.log('  ADMIN_EMAIL=x ADMIN_PASSWORD=x ts-node setup-admin.ts\n');

    email    = await prompt('Email [admin@oscarpart.id]: ', 'admin@oscarpart.id');
    fullName = await prompt('Nama lengkap [OSCARPART Administrator]: ', 'OSCARPART Administrator');

    // Password with validation loop
    let valid = false;
    password = '';
    while (!valid) {
      password = await prompt('Password (min 8 char, huruf kapital, angka, simbol): ');
      const errs = validatePassword(password);
      if (errs.length === 0) {
        valid = true;
      } else {
        console.log('⚠  Password tidak valid:');
        errs.forEach((e) => console.log(`   - ${e}`));
      }
    }
  }

  console.log('\nHashing password (bcrypt rounds=12)...');
  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string; email: string; role: string }>(
      `INSERT INTO users (
        email, password_hash, full_name, role, status,
        company_name, contact_person, position
      )
      VALUES ($1, $2, $3, 'superadmin', 'approved', 'OSCARPART', $3, 'Superadmin')
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            full_name     = EXCLUDED.full_name,
            role          = 'superadmin',
            status        = 'approved',
            updated_at    = NOW()
      RETURNING id, email, role`,
      [email, passwordHash, fullName]
    );

    await client.query('COMMIT');

    const admin = result.rows[0];
    console.log('\n✅ Superadmin ready:');
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);

    if (!isNonInteractive) {
      console.log('\n⚠️  SIMPAN password ini dengan aman. Jangan bagikan ke siapapun.\n');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Setup gagal:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
