// Script to extract all sheets, formulas, and data from the Excel file
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'excel-source.xlsm'), { 
  cellFormula: true, 
  cellStyles: true,
  cellNF: true,
  sheetStubs: true,
  bookVBA: true
});

const outDir = path.join(__dirname, 'excel-extract');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

console.log('=== SHEETS ===');
console.log(wb.SheetNames.join('\n'));
console.log(`\nTotal: ${wb.SheetNames.length} sheets\n`);

// Extract VBA macro names if available
if (wb.vbaraw) {
  console.log('=== VBA MACROS DETECTED ===');
  console.log(`VBA blob size: ${wb.vbaraw.length} bytes`);
  fs.writeFileSync(path.join(outDir, 'vba_raw.bin'), wb.vbaraw);
  console.log('VBA raw binary saved to excel-extract/vba_raw.bin\n');
}

// For each sheet, dump: data as JSON + all formulas
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const safeName = name.replace(/[^a-zA-Z0-9àáâãäåèéêëìíîïòóôõöùúûüçñ _-]/gi, '_');
  
  // Get range
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const rows = range.e.r - range.s.r + 1;
  const cols = range.e.c - range.s.c + 1;
  
  console.log(`--- Sheet: "${name}" (${rows} rows × ${cols} cols) ---`);
  
  // Extract data as CSV
  const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
  fs.writeFileSync(path.join(outDir, `${safeName}.csv`), csv, 'utf-8');
  
  // Extract formulas
  const formulas = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && cell.f) {
        formulas.push({
          cell: addr,
          formula: cell.f,
          value: cell.v,
          type: cell.t
        });
      }
    }
  }
  
  if (formulas.length > 0) {
    console.log(`  Formulas: ${formulas.length}`);
    fs.writeFileSync(
      path.join(outDir, `${safeName}_formulas.json`), 
      JSON.stringify(formulas, null, 2), 
      'utf-8'
    );
  }

  // Extract named ranges if any
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  fs.writeFileSync(
    path.join(outDir, `${safeName}_data.json`), 
    JSON.stringify(json.slice(0, 200), null, 2), // First 200 rows 
    'utf-8'
  );
}

// Named ranges
if (wb.Workbook && wb.Workbook.Names) {
  console.log('\n=== NAMED RANGES ===');
  const names = wb.Workbook.Names.map(n => `${n.Name} = ${n.Ref}`);
  console.log(names.join('\n'));
  fs.writeFileSync(path.join(outDir, 'named_ranges.json'), JSON.stringify(wb.Workbook.Names, null, 2), 'utf-8');
}

console.log('\n✅ Extraction complete → excel-extract/');
