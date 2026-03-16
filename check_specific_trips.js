
const sql = require('mssql');
const fs = require('fs');

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

async function check() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT * FROM cartas_de_porte WHERE numero_cp IN ('ADT-4577', 'ADT-2053') OR id LIKE 'ADT-4577%' OR id LIKE 'ADT-2053%'");
        fs.writeFileSync('trips_debug.json', JSON.stringify(res.recordset, null, 2));
        await sql.close();
    } catch (err) {
        fs.writeFileSync('trips_debug.json', err.toString());
    }
}
check();
