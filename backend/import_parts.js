const { Client } = require('pg');
const XLSX = require('xlsx');

// Ganti dengan Public Connection URL dari Railway (sudah termasuk password)
const DATABASE_URL = 'postgresql://postgres:knhHtBnzSgqyzlxOoVCaVdraJujhPJls@zephyr.proxy.rlwy.net:21552/railway';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importData() {
  try {
    // Baca file Excel
    const workbook = XLSX.readFile('DATA MASTER PN ALL BRAND-SCOPY.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`📄 Membaca ${rows.length} baris dari Excel...`);

    await client.connect();
    console.log('✅ Terhubung ke database.');

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const part_number = row.part_number || row['part_number'];
      if (!part_number) {
        skipped++;
        continue;
      }

      const brand_name = row.brand || null;
      const unit_type = row.unit_type || null;
      const description = row.description || null;
      const notes = row.notes || null;

      // Insert atau update (upsert) hanya kolom yang tersedia
      const query = `
        INSERT INTO parts (part_number, brand_name, unit_type, description, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (part_number) DO UPDATE SET
          brand_name = EXCLUDED.brand_name,
          unit_type = EXCLUDED.unit_type,
          description = EXCLUDED.description,
          notes = EXCLUDED.notes
      `;
      await client.query(query, [part_number, brand_name, unit_type, description, notes]);
      inserted++;
      if (inserted % 100 === 0) console.log(`📝 Sudah memproses ${inserted} part...`);
    }

    console.log(`✅ Selesai! ${inserted} part berhasil diimport, ${skipped} baris dilewati (tidak ada part_number).`);
  } catch (err) {
    console.error('❌ Gagal:', err.message);
  } finally {
    await client.end();
  }
}

importData();