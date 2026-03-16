const { DataSource } = require('typeorm');

async function findCreationLog() {
    const ds = new DataSource({
        type: 'mssql',
        host: '127.0.0.1',
        port: 1499,
        username: 'sa',
        password: 'YourStrongPassword123',
        database: 'adt_db',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    });

    try {
        await ds.initialize();
        // Buscamos cualquier log que mencione ADT-1137 en la descripción
        const logs = await ds.query("SELECT * FROM audit_logs WHERE descripcion LIKE '%ADT-1137%' ORDER BY fecha DESC");
        console.log(JSON.stringify(logs, null, 2));
        await ds.destroy();
    } catch (err) {
        console.error(err.message);
    }
}

findCreationLog();
