const { Client } = require('pg');

// Ganti dengan password asli Anda jika perlu
const PASSWORD = 'knhHtBnzSgqyzlxOoVCaVdraJujhPJls';

const DATABASE_URL = `postgresql://postgres:${PASSWORD}@zephyr.proxy.rlwy.net:21552/railway?sslmode=require`;

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false   // abaikan self-signed certificate
  }
});

async function kosongkan() {
  try {
    await client.connect();
    const res = await client.query('UPDATE parts SET price = NULL, stock = NULL;');
    console.log('✅ Berhasil mengosongkan ' + res.rowCount + ' part.');
  } catch (err) {
    console.error('❌ Gagal:', err.message);
  } finally {
    await client.end();
  }
}

kosongkan();