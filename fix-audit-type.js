
const { DataSource } = require('typeorm');

async function fix() {
    const ds = new DataSource({
        type: 'mssql',
        host: '127.0.0.1',
        port: 1499,
        username: 'sa',
        password: 'YourStrongPassword123',
        database: 'adt_db',
        options: { encrypt: true, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        console.log('--- CORRIGIENDO TIPO DE DATO EN AUDIT_LOGS ---');
        
        // Convertir TEXT a NVARCHAR(255) para permitir comparaciones
        await ds.query('ALTER TABLE audit_logs ALTER COLUMN accion NVARCHAR(255) NOT NULL');
        console.log('Columna "accion" convertida exitosamente.');

        await ds.destroy();
    } catch (err) {
        console.error('Error al ejecutar la corrección:', err);
    }
}

fix();
