
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

        const wallets = await sql.query("SELECT * FROM billetera_saldos");
        const trips = await sql.query(`
            SELECT id, numero_cp, estado, es_credito, monto_upcharge, ts_creacion, client_id, revenue_at_execution 
            FROM cartas_de_porte 
            WHERE ts_creacion >= '2026-03-01'
            ORDER BY ts_creacion DESC
        `);
        const pricing = await sql.query("SELECT * FROM tenant_pricing ORDER BY fecha_desde DESC");

        const result = {
            wallets: wallets.recordset,
            trips: trips.recordset,
            pricing: pricing.recordset
        };

        fs.writeFileSync('debug_data.json', JSON.stringify(result, null, 2));
        console.log('Data saved to debug_data.json');

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}
check();
