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

async function getTenantImap() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT nombre_empresa, imap_host, imap_user FROM tenants WHERE id = 'EBC7423E-F36B-1410-8A83-00A64490CC08'");
        console.log(res.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

getTenantImap();
