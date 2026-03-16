
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
        console.log('--- AÑADIENDO COLUMNAS DE RESOLUCION A AUDIT_LOGS ---');
        
        await ds.query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'resuelto') ALTER TABLE audit_logs ADD resuelto BIT DEFAULT 0");
        await ds.query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'comentario_resolucion') ALTER TABLE audit_logs ADD comentario_resolucion NVARCHAR(MAX)");
        await ds.query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'resuelto_por') ALTER TABLE audit_logs ADD resuelto_por NVARCHAR(255)");
        
        console.log('Columnas añadidas exitosamente.');
        await ds.destroy();
    } catch (err) {
        console.error('Error:', err);
    }
}

fix();
