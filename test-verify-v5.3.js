const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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

async function verify() {
    try {
        console.log('--- VERIFICACIÓN ECOSISTEMA FINANCIERO 360 v5.3 ---');
        await sql.connect(config);

        // 1. Verificar Tablas
        const tablesToCheck = ['financial_lotes', 'payment_lotes', 'lote_deducciones', 'adt_recaudaciones', 'adt_credits'];
        for (const table of tablesToCheck) {
            const res = await sql.query(`SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${table}'`);
            if (res.recordset.length > 0) {
                console.log(`[OK] Tabla '${table}' existe.`);
            } else {
                console.error(`[ERROR] Tabla '${table}' NO existe.`);
            }
        }

        // 2. Verificar Columnas en cartas_de_porte
        const colsToCheck = ['precio_dador_snap', 'deuda_upcharge', 'financial_lot_id', 'payment_lot_id'];
        for (const col of colsToCheck) {
            const res = await sql.query(`SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('cartas_de_porte') AND name = '${col}'`);
            if (res.recordset.length > 0) {
                console.log(`[OK] Columna '${col}' en 'cartas_de_porte' existe.`);
            } else {
                console.error(`[ERROR] Columna '${col}' en 'cartas_de_porte' NO existe.`);
            }
        }

        // 3. Verificar Carpeta de Storage
        const storageMain = path.join(process.cwd(), 'storage');
        if (fs.existsSync(storageMain)) {
            console.log(`[OK] Carpeta 'storage' base existe.`);
        } else {
            console.warn(`[AVISO] Carpeta 'storage' no existe aún (se creará al primer lote).`);
        }

        console.log('--- CIERRE DE VERIFICACIÓN ---');
    } catch (err) {
        console.error('Error de verificación:', err.message);
    } finally {
        await sql.close();
    }
}

verify();
