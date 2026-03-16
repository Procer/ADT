
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

        const tables = ['tenants', 'users', 'drivers'];
        for (const table of tables) {
            console.log(`--- COLUMNS FOR ${table} ---`);
            const cols = await sql.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
            console.table(cols.recordset);
        }

        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
