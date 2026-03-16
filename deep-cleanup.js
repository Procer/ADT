const { createConnection } = require('typeorm');

async function totalCleanup() {
    // Configuración para MSSQL
    const mssqlConfig = {
        type: 'mssql',
        host: 'localhost',
        port: 1435,
        username: 'sa',
        password: 'StrongPassword123!',
        database: 'adt_db',
        options: { encrypt: true, trustServerCertificate: true }
    };

    // Configuración para Postgres
    const pgConfig = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'adt_db'
    };

    const targets = [
        { name: 'MSSQL', config: mssqlConfig },
        { name: 'Postgres', config: pgConfig }
    ];

    for (const target of targets) {
        try {
            console.log(`Intentando limpiar ${target.name}...`);
            const connection = await createConnection(target.config);
            
            // Orden de borrado para respetar llaves foráneas
            const tables = [
                'gps_tracking', 
                'audit_logs', 
                'travel_credits', 
                'cartas_de_porte', 
                'drivers', 
                'transport_units',
                'clients'
            ];

            for (const table of tables) {
                try {
                    await connection.query(`DELETE FROM ${table}`);
                    console.log(`  - [OK] Tabla ${table} limpiada.`);
                } catch (e) {
                    console.log(`  - [SKIP] Tabla ${table} no existe o no se pudo limpiar.`);
                }
            }

            await connection.close();
            console.log(`${target.name} limpiado con éxito.
`);
        } catch (err) {
            console.error(`No se pudo conectar a ${target.name}: ${err.message}
`);
        }
    }
}

totalCleanup();
