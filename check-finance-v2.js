
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
        console.log('--- VIAJES ---');
        const trips = await sql.query('SELECT id, numero_cp, estado, tenant_id, client_id, es_credito, precio_congelado FROM cartas_de_porte');
        console.table(trips.recordset);

        console.log('--- PRECIOS TENANT ---');
        const pricing = await sql.query('SELECT * FROM tenant_pricing');
        console.table(pricing.recordset);

        console.log('--- CLIENTES (DADORES) ---');
        const clients = await sql.query('SELECT id, nombre_razon_social, tenant_id, precio_por_cp FROM clients');
        console.table(clients.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}
run();
