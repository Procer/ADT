
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'StrongPassword123!',
    database: 'adt_db',
    server: 'localhost',
    port: 1435,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        await sql.connect(config);

        console.log('--- TABLES ---');
        const tables = await sql.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
        console.table(tables.recordset);

        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
