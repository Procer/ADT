const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    server: '127.0.0.1',
    port: 1499,
    database: 'adt_db',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        console.log('Viajes en cartas_de_porte:');
        const trips = await sql.query('SELECT id, numero_cp, estado, ts_creacion, tenant_id, client_id, es_credito FROM cartas_de_porte');
        console.table(trips.recordset);

        console.log('Saldos en billetera_saldos:');
        const wallet = await sql.query('SELECT * FROM billetera_saldos');
        console.table(wallet.recordset);

        console.log('Tenants:');
        const tenants = await sql.query('SELECT id, nombre_empresa FROM tenants');
        console.table(tenants.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
