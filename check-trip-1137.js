const { DataSource } = require('typeorm');

async function checkTrip() {
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
        const trip = await ds.query("SELECT * FROM cartas_de_porte WHERE numero_cp = 'ADT-1137'");
        console.log(JSON.stringify(trip, null, 2));
        await ds.destroy();
    } catch (err) {
        console.error(err.message);
    }
}

checkTrip();
