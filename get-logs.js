const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrongPassword123',
    server: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '1499'),
    database: process.env.DB_NAME || 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function getRecentLogs() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT TOP 20 id, remitente, asunto, estado_ingesta, error_detalle, created_at FROM email_ingestion_logs ORDER BY created_at DESC");
        console.log(JSON.stringify(res.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

getRecentLogs();
