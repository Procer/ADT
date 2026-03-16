const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    server: 'localhost',
    port: 1499,
    database: 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function fix() {
    try {
        console.log('Conectando a MSSQL en puerto 1499...');
        await sql.connect(config);
        console.log('Conexión exitosa.');

        console.log('Borrando tabla billetera_saldos y sus dependencias...');
        
        // Primero intentamos borrar las FKs que referencian a esta tabla si existen
        // Y luego borramos la tabla
        const query = `
            IF OBJECT_ID('dbo.billetera_saldos', 'U') IS NOT NULL
            BEGIN
                -- Buscar constraints que dependan de la tabla y borrarlos
                DECLARE @sql NVARCHAR(MAX) = '';
                SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                                ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
                FROM sys.foreign_keys
                WHERE referenced_object_id = OBJECT_ID('dbo.billetera_saldos');

                EXEC sp_executesql @sql;

                DROP TABLE dbo.billetera_saldos;
                PRINT 'Tabla billetera_saldos borrada con éxito.';
            END
            ELSE
            BEGIN
                PRINT 'La tabla billetera_saldos no existe.';
            END
        `;

        await sql.query(query);
        console.log('Operación completada.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sql.close();
    }
}

fix();
