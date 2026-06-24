const fs = require('fs');
const path = require('path');

const output = path.join(__dirname, 'public');
fs.mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) {
  fs.copyFileSync(path.join(__dirname, file), path.join(output, file));
}
console.log('Static site created in public/');
