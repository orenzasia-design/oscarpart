import * as XLSX from 'xlsx';
import logger from '../config/logger';

// ============================================================
// Types
// ============================================================

export interface ParsedRfqRow {
  part_number: string;
  description?: string;
  brand?: string;
  unit_type?: string;
  qty_requested: number;
  row_index: number;
  raw: Record<string, unknown>;
}

export interface ParseResult {
  rows: ParsedRfqRow[];
  errors: string[];
  total_rows: number;
  valid_rows: number;
}

// ============================================================
// Column name aliases (handles various header formats)
// ============================================================

const PART_NUMBER_ALIASES = [
  'part_number', 'part number', 'partnumber', 'part no', 'partno',
  'part#', 'item_number', 'item number', 'item no', 'kode part',
  'nomor part', 'no part', 'part code', 'article', 'sku', 'code',
];

const QTY_ALIASES = [
  'qty', 'quantity', 'qty_requested', 'jumlah', 'amount',
  'qty_order', 'order qty', 'required qty',
];

const DESCRIPTION_ALIASES = [
  'description', 'desc', 'name', 'item name', 'part name',
  'deskripsi', 'nama part', 'keterangan',
];

const BRAND_ALIASES = [
  'brand', 'manufacturer', 'make', 'merk', 'merek', 'vendor',
];

const UNIT_ALIASES = [
  'unit', 'unit_type', 'uom', 'satuan', 'unit of measure', 'pcs',
];

function findColumn(
  headers: string[],
  aliases: string[]
): string | null {
  const lc = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lc.indexOf(alias.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

// ============================================================
// Parse XLSX/XLS/CSV buffer → rows
// ============================================================

export function parseRfqFile(
  buffer: Buffer,
  fileType: 'xlsx' | 'xls' | 'csv'
): ParseResult {
  const errors: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type:  'buffer',
      raw:   false,
      dense: false,
    });
  } catch (err) {
    return {
      rows:       [],
      errors:     [`Gagal membaca file: ${err instanceof Error ? err.message : String(err)}`],
      total_rows: 0,
      valid_rows: 0,
    };
  }

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ['File tidak memiliki sheet.'], total_rows: 0, valid_rows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval:    null,
    raw:       false,
    blankrows: false,
  });

  if (!rawData || rawData.length === 0) {
    return { rows: [], errors: ['Sheet kosong atau tidak ada data.'], total_rows: 0, valid_rows: 0 };
  }

  const headers = Object.keys(rawData[0]);

  // Map columns
  const colPartNumber  = findColumn(headers, PART_NUMBER_ALIASES);
  const colQty         = findColumn(headers, QTY_ALIASES);
  const colDescription = findColumn(headers, DESCRIPTION_ALIASES);
  const colBrand       = findColumn(headers, BRAND_ALIASES);
  const colUnit        = findColumn(headers, UNIT_ALIASES);

  if (!colPartNumber) {
    errors.push('Kolom "Part Number" tidak ditemukan. Header yang diperlukan: part_number, part no, atau nomor part.');
    return { rows: [], errors, total_rows: rawData.length, valid_rows: 0 };
  }

  if (!colQty) {
    errors.push('Kolom "Qty" tidak ditemukan. Header yang diperlukan: qty, quantity, atau jumlah.');
  }

  const rows: ParsedRfqRow[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowNum = i + 2; // +2 because header is row 1, data starts row 2

    const rawPartNumber = row[colPartNumber!];
    if (!rawPartNumber) continue; // Skip empty rows

    const partNumber = String(rawPartNumber).trim().toUpperCase();
    if (partNumber.length < 2) {
      errors.push(`Baris ${rowNum}: Part number terlalu pendek "${partNumber}"`);
      continue;
    }

    let qty = 1;
    if (colQty && row[colQty] !== null && row[colQty] !== undefined) {
      const qtyRaw = parseFloat(String(row[colQty]).replace(/,/g, ''));
      if (isNaN(qtyRaw) || qtyRaw <= 0) {
        errors.push(`Baris ${rowNum}: Qty tidak valid "${row[colQty]}", menggunakan 1.`);
      } else {
        qty = qtyRaw;
      }
    }

    rows.push({
      part_number:   partNumber,
      description:   colDescription && row[colDescription] ? String(row[colDescription]).trim() : undefined,
      brand:         colBrand && row[colBrand]       ? String(row[colBrand]).trim()       : undefined,
      unit_type:     colUnit  && row[colUnit]         ? String(row[colUnit]).trim()         : undefined,
      qty_requested: qty,
      row_index:     rowNum,
      raw:           row,
    });
  }

  return {
    rows,
    errors:     errors.slice(0, 50), // cap errors shown
    total_rows: rawData.length,
    valid_rows: rows.length,
  };
}

// ============================================================
// Generate blank RFQ template buffer (XLSX)
// ============================================================

export function generateRfqTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  const headers = [
    'part_number', 'description', 'brand', 'unit_type', 'qty',
  ];

  const sampleData = [
    ['CAT-123-456', 'Filter Oil Caterpillar', 'Caterpillar', 'PCS', 10],
    ['KOM-789-012', 'Seal Kit Hydraulic', 'Komatsu',    'SET', 5],
    ['', '', '', '', ''],  // blank row hint
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'RFQ Template');

  // Instructions sheet
  const instructions = [
    ['INSTRUKSI PENGISIAN RFQ TEMPLATE'],
    [''],
    ['Kolom Wajib:'],
    ['part_number', 'Nomor part/kode part (wajib diisi)'],
    ['qty',         'Jumlah yang dibutuhkan (default: 1)'],
    [''],
    ['Kolom Opsional:'],
    ['description', 'Deskripsi / nama part'],
    ['brand',       'Merek / manufacturer'],
    ['unit_type',   'Satuan (PCS, SET, UNIT, MTR, dll)'],
    [''],
    ['Catatan:'],
    ['- Maksimal 500 baris per file upload'],
    ['- Format yang didukung: XLSX, XLS, CSV'],
    ['- Part number tidak case-sensitive (akan dikonversi ke UPPERCASE)'],
    ['- Jangan mengubah nama kolom header'],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
  wsInstr['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruksi');

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
