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

async function checkColumns() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tenants'");
        res.recordset.forEach(c => console.log(c.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkColumns();
