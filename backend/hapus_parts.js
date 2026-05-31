const { Client } = require('pg');

// Ganti dengan Public Connection URL dari gambar Anda (tapi password diganti dengan yang asli)
const DATABASE_URL = 'postgresql://postgres:knhHtBnzSgqyzlxOoVCaVdraJujhPJls@egphy.proxy.riley.net:21552/railway?sslmode=require';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hapusSemua() {
  try {
    await client.connect();
    await client.query('TRUNCATE parts RESTART IDENTITY;');
    console.log('✅ Berhasil menghapus SEMUA data parts.');
  } catch (err) {
    console.error('❌ Gagal:', err.message);
  } finally {
    await client.end();
  }
}

hapusSemua();