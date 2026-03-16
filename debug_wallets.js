
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

async function check() {
    try {
        await sql.connect(config);

        console.log('--- ALL WALLETS (billetera_saldos) ---');
        const wallets = await sql.query("SELECT * FROM billetera_saldos");
        console.log(JSON.stringify(wallets.recordset, null, 2));

        console.log('--- RECENT TRIPS (MARCH 2026) ---');
        const trips = await sql.query(`
            SELECT id, numero_cp, estado, es_credito, monto_upcharge, ts_creacion, client_id, revenue_at_execution 
            FROM cartas_de_porte 
            WHERE ts_creacion >= '2026-03-01'
            ORDER BY ts_creacion DESC
        `);
        console.log(JSON.stringify(trips.recordset, null, 2));

        console.log('--- TENANT PRICING ---');
        const pricing = await sql.query("SELECT * FROM tenant_pricing ORDER BY fecha_desde DESC");
        console.log(JSON.stringify(pricing.recordset, null, 2));

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}
check();
