const fs = require('fs');
const content = fs.readFileSync('seed.js', 'utf8');
const startIndex = content.indexOf('const products = [');
const endIndex = content.indexOf('];', startIndex) + 1;
const productsStr = content.substring(startIndex + 'const products = '.length, endIndex);
const products = eval(productsStr);
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/jordan_products.json', JSON.stringify(products, null, 2));
console.log('Successfully generated data/jordan_products.json');
