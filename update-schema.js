const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrongPassword123',
    server: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '1499'),
    database: process.env.DB_NAME || 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function updateSchema() {
    try {
        console.log('--- ACTUALIZANDO ESQUEMA DE BASE DE DATOS ---');
        await sql.connect(config);
        console.log('Conectado correctamente.');

        const query = `
            -- 1. Campos en cartas_de_porte
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'distancia_total_recorrida_km')
                ALTER TABLE cartas_de_porte ADD distancia_total_recorrida_km DECIMAL(10, 2) DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'reached_destination')
                ALTER TABLE cartas_de_porte ADD reached_destination BIT DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'ts_cierre_interno')
                ALTER TABLE cartas_de_porte ADD ts_cierre_interno DATETIME NULL;

            -- 2. Campos en gps_tracking
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('gps_tracking') AND name = 'distancia_destino_metros')
                ALTER TABLE gps_tracking ADD distancia_destino_metros DECIMAL(12, 2) NULL;
        `;

        await sql.query(query);
        console.log('✔ Base de Datos actualizada con éxito.');

    } catch (err) {
        console.error('✘ Error al actualizar:', err.message);
    } finally {
        await sql.close();
    }
}

updateSchema();
