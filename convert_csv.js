import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Input CSV source; change the filename if your CSV differs.
const csvPath = path.join(process.cwd(), 'project/dist/haccp_source.csv');
// Output JSON path used by backend scripts
const jsonPath = path.join(process.cwd(), 'project/dist/products.json');

const csv = fs.readFileSync(csvPath, 'utf8');

Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    fs.writeFileSync(jsonPath, JSON.stringify(results.data, null, 2));
    console.log('CSV to JSON conversion complete!');
  },
});
