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
        console.log('--- COLUMNS FOR cartas_de_porte ---');
        const res1 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cartas_de_porte'");
        res1.recordset.forEach(c => console.log(c.COLUMN_NAME));

        console.log('\n--- COLUMNS FOR gps_tracking ---');
        const res2 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'gps_tracking'");
        res2.recordset.forEach(c => console.log(c.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkColumns();
