
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    database: 'adt_db',
    server: '127.0.0.1',
    port: 1499,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT id, nombre_empresa, deuda_actual FROM tenants WHERE id = '8AF3423E-F36B-1410-8A7F-00A64490CC08'");
        console.log(JSON.stringify(res.recordset, null, 2));
        await sql.close();
    } catch (e) {
        console.error(e);
    }
}
run();
