
const { createConnection } = require('typeorm');
const path = require('path');

async function checkSmtp() {
    try {
        const connection = await createConnection({
            type: 'mssql',
            host: 'localhost',
            port: 1435,
            username: 'sa',
            password: 'StrongPassword123!',
            database: 'adt_db',
            entities: [path.join(__dirname, 'dist/database/entities/*.entity.js')],
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        });

        console.log('--- GLOBAL SMTP CONFIGURATION ---');
        const config = await connection.query("SELECT * FROM system_config WHERE config_key = 'GLOBAL_SETTINGS'");
        console.log(JSON.stringify(config, null, 2));

        console.log('\n--- TENANT SMTP CONFIGURATION ---');
        const tenants = await connection.query("SELECT id, nombre_empresa, smtp_host, smtp_user, smtp_from FROM tenants WHERE smtp_host IS NOT NULL");
        console.table(tenants);

        await connection.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSmtp();
