
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

        console.log('--- CREDITS ---');
        const credits = await sql.query("SELECT * FROM adt_credits");
        console.log(JSON.stringify(credits.recordset, null, 2));

        console.log('--- TRIP WITH CREDIT (ADT-5241) ---');
        const trips = await sql.query("SELECT id, numero_cp, es_credito, monto_upcharge, ts_creacion FROM cartas_de_porte WHERE numero_cp = 'ADT-5241'");
        console.log(JSON.stringify(trips.recordset, null, 2));

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}
check();
