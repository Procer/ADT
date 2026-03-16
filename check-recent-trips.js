const { createConnection } = require('typeorm');

async function check() {
    try {
        const connection = await createConnection({
            type: 'mssql',
            host: 'localhost',
            port: 1435,
            username: 'sa',
            password: 'StrongPassword123!',
            database: 'adt_db',
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        });

        console.log('--- RECENT TRIPS ---');
        const trips = await connection.query(`
            SELECT TOP 5 
                id, 
                numero_cp, 
                ts_creacion, 
                estado, 
                es_credito, 
                monto_upcharge, 
                monto_abonado_original,
                precio_congelado,
                client_id
            FROM cartas_de_porte 
            ORDER BY ts_creacion DESC
        `);
        console.table(trips);

        await connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
