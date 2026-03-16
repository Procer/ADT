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

async function search() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT * FROM email_ingestion_logs WHERE asunto LIKE '%VIAJE%' ORDER BY created_at DESC");
        console.log("Found logs:", res.recordset.length);
        res.recordset.forEach(log => {
            console.log(`- ID: ${log.id}, Subject: ${log.asunto}, Status: ${log.estado_ingesta}, Date: ${log.created_at}`);
        });

        const res2 = await sql.query("SELECT id, origen_nombre, ts_creacion FROM cartas_de_porte ORDER BY ts_creacion DESC");
        console.log("\nRecent Trips:", res2.recordset.length);
        res2.recordset.slice(0, 5).forEach(t => {
            console.log(`- ID: ${t.id}, Origin: ${t.origen_nombre}, Date: ${t.ts_creacion}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

search();
