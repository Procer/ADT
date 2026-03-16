
const { createConnection } = require('typeorm');

async function truncate() {
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

        console.log('Conectado a la base de datos para limpieza...');
        
        // Deshabilitar restricciones temporalmente o borrar en orden
        await connection.query('DELETE FROM gps_tracking');
        await connection.query('DELETE FROM audit_logs');
        await connection.query('DELETE FROM travel_credits');
        await connection.query('DELETE FROM cartas_de_porte');
        await connection.query('DELETE FROM drivers');
        await connection.query('DELETE FROM transport_units');
        
        console.log('Tablas de Choferes, Unidades y Tráfico limpiadas con éxito.');

        await connection.close();
    } catch (err) {
        console.error('Error durante la limpieza:', err);
    }
}

truncate();
