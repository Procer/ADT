const { DataSource } = require('typeorm');

async function diag() {
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
        console.log('--- DIAGNÓSTICO DE VIAJES ACTIVOS ---');
        
        const trips = await ds.query(`
            SELECT cp.id, cp.estado, u.patente, d.nombre 
            FROM cartas_de_porte cp
            LEFT JOIN transport_units u ON u.id = cp.unidad_id
            LEFT JOIN drivers d ON d.id = cp.chofer_id
            WHERE cp.estado = 'EN_CAMINO'
        `);

        console.log(`Total In Progress: ${trips.length}`);
        
        for (const t of trips) {
            const gps = await ds.query(`
                SELECT TOP 1 latitud, longitud, timestamp_dispositivo 
                FROM gps_tracking 
                WHERE carta_porte_id = '${t.id}' 
                ORDER BY timestamp_dispositivo DESC
            `);
            console.log(`Patente: ${t.patente} | GPS: ${gps.length > 0 ? `${gps[0].latitud}, ${gps[0].longitud}` : 'SIN DATOS'}`);
        }

        await ds.destroy();
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

diag();
