const { DataSource } = require('typeorm');

async function debugWeights() {
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
        const results = await ds.query("SELECT id, numero_cp, estado, peso_toneladas FROM cartas_de_porte");
        console.log('--- TRIP WEIGHTS DEBUG ---');
        console.table(results);
        
        // Si hay viajes en 0, actualizamos uno para probar
        const tripAtZero = results.find(r => Number(r.peso_toneladas) === 0);
        if (tripAtZero) {
            console.log(`Actualizando viaje ${tripAtZero.numero_cp} a 28.5 toneladas para prueba...`);
            await ds.query(`UPDATE cartas_de_porte SET peso_toneladas = 28.5 WHERE id = '${tripAtZero.id}'`);
            console.log('Actualización completada.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}
debugWeights();
