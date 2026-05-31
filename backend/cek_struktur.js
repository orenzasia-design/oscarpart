const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:knhHtBnzSgqyzlxOoVCaVdraJujhPJls@zephyr.proxy.rlwy.net:21552/railway';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cek() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parts'
      ORDER BY ordinal_position;
    `);
    console.log('Kolom dalam tabel parts:');
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
cek();