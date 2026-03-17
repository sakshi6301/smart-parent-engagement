const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

// ── Validators ──────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validateRow(row, index) {
  const errors = [];
  const r = index + 2; // 1-based + header row

  if (!row.StudentID)    errors.push(`Row ${r}: StudentID is required`);
  if (!row.StudentName)  errors.push(`Row ${r}: StudentName is required`);
  if (!row.Class)        errors.push(`Row ${r}: Class is required`);
  if (!row.ParentName)   errors.push(`Row ${r}: ParentName is required`);
  if (!row.ParentPhone)  errors.push(`Row ${r}: ParentPhone is required`);
  else if (!PHONE_RE.test(String(row.ParentPhone).trim()))
    errors.push(`Row ${r}: ParentPhone '${row.ParentPhone}' is invalid (must be 10-digit Indian mobile)`);
  if (row.ParentEmail && !EMAIL_RE.test(String(row.ParentEmail).trim()))
    errors.push(`Row ${r}: ParentEmail '${row.ParentEmail}' is invalid`);

  return errors;
}

// ── Parsers ──────────────────────────────────────────────────
function parseXlsx(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer.toString())
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// ── Main export ──────────────────────────────────────────────
async function parseAndValidate(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  let rows;

  if (ext === 'xlsx' || ext === 'xls') {
    rows = parseXlsx(file.buffer);
  } else if (ext === 'csv') {
    rows = await parseCsv(file.buffer);
  } else {
    throw new Error('Unsupported file type. Upload .csv or .xlsx');
  }

  // Normalise keys (trim whitespace)
  rows = rows.map(r =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v).trim()]))
  );

  const valid = [];
  const errors = [];

  rows.forEach((row, i) => {
    const rowErrors = validateRow(row, i);
    if (rowErrors.length) errors.push(...rowErrors);
    else valid.push(row);
  });

  return { valid, errors, total: rows.length };
}

module.exports = { parseAndValidate };
