const fs = require('fs');
const path = require('path');

const directory = 'c:/laragon/www/ADT/dashboard/src/components';
const files = fs.readdirSync(directory);

files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const filePath = path.join(directory, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace the definition with the import
        const regex = /const API_BASE_URL = import\.meta\.env\.VITE_API_URL( \|\| '.*')?;/g;
        if (regex.test(content)) {
            console.log(`Updating ${file}...`);
            content = content.replace(regex, '');
            // Add import at the top if not present
            if (!content.includes("import { API_BASE_URL } from '../config'")) {
                content = "import { API_BASE_URL } from '../config';\n" + content;
            }
            fs.writeFileSync(filePath, content);
        }
    }
});
