import fs from 'fs';
import Papa from 'papaparse';

const csvPath = 'd:/Users/KUON/Downloads/새 폴더/project1/project/public/haccp_음료 분류 .csv';
const jsonPath = 'd:/Users/KUON/Downloads/새 폴더/project1/project/public/products.json';

const csv = fs.readFileSync(csvPath, 'utf8');

Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        fs.writeFileSync(jsonPath, JSON.stringify(results.data, null, 2));
        console.log('CSV to JSON conversion complete!');
    }
});
