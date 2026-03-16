const { DataSource } = require('typeorm');

async function debugSimulation() {
    const ds = new DataSource({
        type: "mssql",
        host: "127.0.0.1",
        port: 1499,
        username: "sa",
        password: "YourStrongPassword123",
        database: "adt_db",
        options: { encrypt: true, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        // Buscamos los dadores de carga para identificar el ID del que mencionas
        const clients = await ds.query("SELECT id, nombre_razon_social, tenant_id FROM clients");
        console.log('--- CLIENTS ---');
        console.table(clients);

        if (clients.length > 0) {
            const clientId = clients[0].id;
            const tenantId = clients[0].tenant_id;
            console.log(`Analizando viajes para Cliente: ${clients[0].nombre_razon_social} (${clientId})`);
            
            const trips = await ds.query(`SELECT id, numero_cp, estado, tenant_id, client_id, ts_creacion FROM cartas_de_porte WHERE client_id = '${clientId}'`);
            console.log('--- TRIPS FOR THIS CLIENT ---');
            console.table(trips);
            
            if (trips.length > 0) {
                console.log('REGLA DE SIMULACIÓN ACTUAL: El código busca tenantId Y clientId exactos.');
                console.log(`Buscando: tenantId='${tenantId}' AND clientId='${clientId}'`);
                const match = trips.filter(t => t.tenant_id === tenantId);
                console.log(`Viajes que coinciden con el filtro de tenant: ${match.length}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}
debugSimulation();
