const { createConnection } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkPwaLogs() {
    try {
        const connection = await createConnection({
            type: 'mssql',
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '1499'),
            username: process.env.DB_USERNAME || 'sa',
            password: process.env.DB_PASSWORD || 'YourStrongPassword123',
            database: process.env.DB_NAME || 'adt_db',
            options: {
                encrypt: true,
                trustServerCertificate: true,
            }
        });

        const logs = await connection.query(`
      SELECT TOP 20 * FROM app_logs 
      WHERE contexto = 'PWA_DRIVER' OR level = 'ERROR' 
      ORDER BY ts_log DESC
    `);

        console.log('--- RECENT PWA / ERROR LOGS ---');
        console.log(JSON.stringify(logs, null, 2));

        await connection.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkPwaLogs();
