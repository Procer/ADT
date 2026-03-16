const { DataSource } = require('typeorm');

async function fixData() {
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
        // Corregir ADT-1137
        await ds.query("UPDATE cartas_de_porte SET destino_nombre = 'Zárate, Buenos Aires' WHERE numero_cp = 'ADT-1137'");
        console.log('Viaje ADT-1137 actualizado correctamente.');
        await ds.destroy();
    } catch (err) {
        console.error(err.message);
    }
}

fixData();
