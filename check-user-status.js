const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    database: 'adt_db',
    server: '127.0.0.1',
    port: 1499,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        await sql.connect(config);
        console.log('--- USER STATUS ---');
        const users = await sql.query(`SELECT email, must_change_password FROM users`);
        console.table(users.recordset);
        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
