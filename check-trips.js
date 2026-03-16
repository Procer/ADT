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

async function checkTrips() {
    try {
        await sql.connect(config);

        // Ver si el usuario derosasjm@gmail.com ya es CLIENT
        const userRes = await sql.query("SELECT email, role, client_id FROM users WHERE email = 'derosasjm@gmail.com'");
        const user = userRes.recordset[0];
        console.log("Usuario actual:", JSON.stringify(user, null, 2));

        if (user && user.client_id) {
            const tripsRes = await sql.query(`SELECT count(*) as total FROM cartas_de_porte WHERE client_id = '${user.client_id}'`);
            console.log(`Viajes para el cliente ${user.client_id}:`, tripsRes.recordset[0].total);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkTrips();
