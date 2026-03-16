const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

async function resetPassword() {
    const ds = new DataSource({
        type: "mssql",
        host: "127.0.0.1",
        port: 1499,
        username: "sa",
        password: "YourStrongPassword123",
        database: "adt_db",
        options: { encrypt: true, trustServerCertificate: true }
    });

    const newPass = "admin123";
    const newHash = await bcrypt.hash(newPass, 10);

    try {
        await ds.initialize();
        console.log('--- RESETEANDO CONTRASEÑA ---');
        const result = await ds.query(`UPDATE users SET password_hash = '${newHash}' WHERE email = 'admin@adt.com'`);
        console.log(`Contraseña para admin@adt.com actualizada a: ${newPass}`);
        console.log('Por favor, intenta loguearte nuevamente en el Dashboard.');
    } catch (err) {
        console.error('ERROR AL RESETEAR:', err.message);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}
resetPassword();
