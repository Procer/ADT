const { DataSource } = require('typeorm');

async function checkAdmin() {
    const ds = new DataSource({
        type: "mssql",
        host: "127.0.0.1",
        port: 1499,
        username: "sa",
        password: "YourStrongPassword123",
        database: "adt_db",
        options: { encrypt: true, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        const user = await ds.query("SELECT email, password_hash, tenant_id, role FROM users WHERE email = 'admin@adt.com'");
        if (user.length > 0) {
            const u = user[0];
            const isHash = u.password_hash.startsWith('$2b$') || u.password_hash.startsWith('$2a$');
            console.log('--- ADMIN DEBUG ---');
            console.log(`Email: ${u.email}`);
            console.log(`Es Hash Bcrypt: ${isHash ? 'SÍ' : 'NO (Texto plano detectado)'}`);
            console.log(`Hash Actual: ${u.password_hash}`);
            console.log(`Tenant ID: ${u.tenant_id}`);
            
            if (u.tenant_id) {
                const tenant = await ds.query(`SELECT activo FROM tenants WHERE id = '${u.tenant_id}'`);
                console.log(`Tenant Activo: ${tenant.length > 0 ? (tenant[0].activo ? 'SÍ' : 'NO (Bloqueado)') : 'N/A'}`);
            }
        } else {
            console.log('Usuario admin@adt.com no encontrado.');
        }
    } catch (err) {
        console.error('ERROR DE CONEXIÓN:', err.message);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}
checkAdmin();
