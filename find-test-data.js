const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    server: 'localhost',
    port: 1499,
    database: 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function findData() {
    try {
        await sql.connect(config);

        console.log('--- TENANTS ---');
        const tenants = await sql.query('SELECT TOP 1 id, nombre_empresa FROM tenants');
        console.table(tenants.recordset);
        const tenantId = tenants.recordset[0]?.id;

        if (tenantId) {
            console.log(`--- CLIENTS FOR TENANT ${tenantId} ---`);
            const clients = await sql.query(`SELECT TOP 1 id, nombre_razon_social FROM clients WHERE tenant_id = '${tenantId}'`);
            console.table(clients.recordset);
            const clientId = clients.recordset[0]?.id;

            if (clientId) {
                console.log(`--- TRIPS FOR CLIENT ${clientId} ---`);
                const trips = await sql.query(`SELECT TOP 3 id, estado, numero_cp FROM cartas_de_porte WHERE tenant_id = '${tenantId}' AND client_id = '${clientId}' AND financial_lot_id IS NULL`);
                console.table(trips.recordset);
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sql.close();
    }
}

findData();
