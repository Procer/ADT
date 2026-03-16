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

async function getIds() {
    try {
        await sql.connect(config);

        const tenant = await sql.query('SELECT TOP 1 id FROM tenants');
        const tenantId = tenant.recordset[0]?.id;
        console.log(`TENANT_ID: ${tenantId}`);

        if (tenantId) {
            const client = await sql.query(`SELECT TOP 1 id FROM clients WHERE tenant_id = '${tenantId}'`);
            const clientId = client.recordset[0]?.id;
            console.log(`CLIENT_ID: ${clientId}`);

            if (clientId) {
                const trips = await sql.query(`SELECT TOP 2 id FROM cartas_de_porte WHERE tenant_id = '${tenantId}' AND client_id = '${clientId}' AND financial_lot_id IS NULL`);
                console.log('TRIP_IDS:');
                trips.recordset.forEach(r => console.log(r.id));
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sql.close();
    }
}

getIds();
