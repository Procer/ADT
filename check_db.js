
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    server: '127.0.0.1',
    port: 1499,
    database: 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        await mssql.connect(config);
        console.log('--- SYSTEM CONFIG ---');
        const configResult = await mssql.query`SELECT smtp_config FROM system_config WHERE config_key = 'GLOBAL_SETTINGS'`;
        console.log(JSON.stringify(configResult.recordset, null, 2));

        console.log('\n--- RECENT ERROR LOGS ---');
        const logResult = await mssql.query`SELECT TOP 5 timestamp, level, mensaje, metadata FROM app_logs ORDER BY timestamp DESC`;
        console.log(JSON.stringify(logResult.recordset, null, 2));

        console.log('\n--- TARGET TENANT ---');
        const tenantResult = await mssql.query`SELECT id, nombre_empresa, smtp_host, smtp_user FROM tenants WHERE id = '2542433E-F36B-1410-8C88-008A7B6CBF56'`;
        console.log(JSON.stringify(tenantResult.recordset, null, 2));

    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await mssql.close();
    }
}

check();
