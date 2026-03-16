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

async function fixUser() {
    try {
        await sql.connect(config);

        // Buscamos el ID del primer cliente disponible (ej: Maruja)
        const clientRes = await sql.query("SELECT TOP 1 id FROM clients");
        const clientId = clientRes.recordset[0]?.id;

        if (!clientId) {
            console.log("No hay clientes en la base de datos.");
            return;
        }

        console.log(`Asignando cliente ${clientId} al usuario derosasjm@gmail.com`);

        await sql.query(`
            UPDATE users 
            SET role = 'CLIENT', 
                client_id = '${clientId}' 
            WHERE email = 'derosasjm@gmail.com'
        `);

        console.log("Usuario actualizado a rol CLIENT con éxito.");
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

fixUser();
