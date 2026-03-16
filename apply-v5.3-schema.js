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

async function applySchema() {
    try {
        console.log('Conectando a MSSQL en puerto 1499...');
        await sql.connect(config);
        console.log('Conexión exitosa.');

        const queries = [
            // 1. Modificar cartas_de_porte para agregar campos de snapshot y lotes
            `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'precio_dador_snap')
             ALTER TABLE cartas_de_porte ADD precio_dador_snap DECIMAL(12,2) DEFAULT 0;`,

            `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'deuda_upcharge')
             ALTER TABLE cartas_de_porte ADD deuda_upcharge DECIMAL(12,2) DEFAULT 0;`,

            `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'financial_lot_id')
             ALTER TABLE cartas_de_porte ADD financial_lot_id UNIQUEIDENTIFIER NULL;`,

            `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = 'payment_lot_id')
             ALTER TABLE cartas_de_porte ADD payment_lot_id UNIQUEIDENTIFIER NULL;`,

            // 2. Crear tabla financial_lotes
            `IF OBJECT_ID('financial_lotes', 'U') IS NULL
             CREATE TABLE financial_lotes (
                 id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                 tenant_id NVARCHAR(255) NOT NULL,
                 client_id UNIQUEIDENTIFIER NOT NULL,
                 total_neto DECIMAL(12,2) DEFAULT 0,
                 status NVARCHAR(50) DEFAULT 'PENDIENTE',
                 proforma_path NVARCHAR(MAX) NULL,
                 created_at DATETIME2 DEFAULT GETDATE()
             );`,

            // 3. Crear tabla payment_lotes
            `IF OBJECT_ID('payment_lotes', 'U') IS NULL
             CREATE TABLE payment_lotes (
                 id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                 tenant_id NVARCHAR(255) NOT NULL,
                 chofer_id UNIQUEIDENTIFIER NOT NULL,
                 total_bruto DECIMAL(12,2) DEFAULT 0,
                 deducciones_total DECIMAL(12,2) DEFAULT 0,
                 neto_final DECIMAL(12,2) DEFAULT 0,
                 comprobante_path NVARCHAR(MAX) NULL,
                 created_at DATETIME2 DEFAULT GETDATE()
             );`,

            // 4. Crear tabla lote_deducciones
            `IF OBJECT_ID('lote_deducciones', 'U') IS NULL
             CREATE TABLE lote_deducciones (
                 id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                 payment_lot_id UNIQUEIDENTIFIER NOT NULL,
                 monto DECIMAL(12,2) NOT NULL,
                 descripcion NVARCHAR(MAX) NOT NULL,
                 tipo NVARCHAR(50) NOT NULL -- ANTICIPO, MULTA, DANOS, OTROS
             );`,

            // 5. Crear tabla adt_recaudaciones
            `IF OBJECT_ID('adt_recaudaciones', 'U') IS NULL
             CREATE TABLE adt_recaudaciones (
                 id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                 tenant_id NVARCHAR(255) NOT NULL,
                 monto DECIMAL(12,2) NOT NULL,
                 status NVARCHAR(50) DEFAULT 'PENDIENTE',
                 auditor_id UNIQUEIDENTIFIER NULL,
                 created_at DATETIME2 DEFAULT GETDATE()
             );`,

            // 6. Crear tabla adt_credits
            `IF OBJECT_ID('adt_credits', 'U') IS NULL
             CREATE TABLE adt_credits (
                 id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                 tenant_id NVARCHAR(255) NOT NULL,
                 viaje_original_id UNIQUEIDENTIFIER NOT NULL,
                 monto_nominal DECIMAL(12,2) NOT NULL,
                 status NVARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, USED, VOID
                 created_at DATETIME2 DEFAULT GETDATE()
             );`
        ];

        for (const query of queries) {
            console.log('Ejecutando query...');
            await sql.query(query);
        }

        console.log('--- Esfuerzo de sincronización completado con éxito ---');

    } catch (err) {
        console.error('Error al aplicar el esquema:', err.message);
    } finally {
        await sql.close();
    }
}

applySchema();
