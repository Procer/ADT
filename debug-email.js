const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkStatus() {
    const dataSource = new DataSource({
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

    try {
        await dataSource.initialize();

        const tenants = await dataSource.query(`
            SELECT id, nombre_empresa as nombre, imap_host, imap_user, 
            CASE WHEN imap_pass IS NOT NULL THEN 'SET' ELSE 'MISSING' END as imap_pass,
            CASE WHEN gemini_api_key IS NOT NULL THEN 'SET' ELSE 'MISSING' END as gemini_api_key,
            activo
            FROM tenants
        `);
        console.log('\n--- Tenants (IMAP Config) ---');
        console.table(tenants);

        const auth = await dataSource.query('SELECT email_autorizado, client_id, asunto_clave FROM client_authorized_emails');
        console.log('\n--- Authorized Emails ---');
        console.table(auth);

        const logs = await dataSource.query('SELECT TOP 10 created_at, remitente, asunto, estado_ingesta, error_detalle FROM email_ingestion_logs ORDER BY created_at DESC');
        console.log('\n--- Email Ingestion Logs (Last 10) ---');
        console.table(logs);

    } catch (err) {
        console.error('FAILED TO CONNECT OR QUERY:', err.message);
    } finally {
        await dataSource.destroy();
    }
}

checkStatus();
