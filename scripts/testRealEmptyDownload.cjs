const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve('public/templates/Templat_Jualan_Mekara_Kosong.xlsx');
if (!fs.existsSync(filePath)) {
  console.error('File does not exist:', filePath);
  process.exit(1);
}

const wb = XLSX.readFile(filePath);
console.log('Workbook sheets:', wb.SheetNames);

const ws = wb.Sheets['Rekod Jualan'];
const range = ws['!ref'];
console.log('Sheet range:', range);

const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log('Total rows in file:', rows.length);
console.log('Row 1 (Headers):', rows[0]);

const dataObjects = XLSX.utils.sheet_to_json(ws);
console.log('Data records in file:', dataObjects.length);

if (rows.length !== 1) {
  console.error('FAILED: More than 1 row exists!');
  process.exit(1);
}

if (dataObjects.length !== 0) {
  console.error('FAILED: Data records found, should be 0!');
  process.exit(1);
}

console.log('VERIFIED: The Excel file is a REAL EMPTY EXCEL FILE with ONLY the column headers!');
