const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '';
const filePath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;
fs.writeFileSync(filePath, content, 'utf8');
console.log(`[prebuild] environment.prod.ts generado con API_URL='${apiUrl}'`);
