const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkEmailIngestion() {
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
        console.log('--- Configuración de Tenants (IMAP) ---');
        const tenants = await dataSource.query('SELECT id, nombre_empresa as nombreEmpresa, imap_host as imapHost, imap_user as imapUser, imap_pass as imapPass, gemini_api_key as geminiApiKey FROM tenants');
        console.table(tenants);

        console.log('\n--- Remitentes Autorizados ---');
        const authEmails = await dataSource.query('SELECT email_autorizado as emailAutorizado, client_id as clientId, asunto_clave as asuntoClave FROM client_authorized_emails');
        console.table(authEmails);

        console.log('\n--- Logs de Ingesta (Últimos 10) ---');
        const logs = await dataSource.query('SELECT TOP 10 * FROM email_ingestion_logs ORDER BY created_at DESC');
        console.table(logs);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await dataSource.destroy();
    }
}

checkEmailIngestion();
