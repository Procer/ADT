const { DataSource } = require('typeorm');

async function check() {
    const ds = new DataSource({
        type: 'mssql',
        host: '127.0.0.1',
        port: 1499,
        username: 'sa',
        password: 'YourStrongPassword123',
        database: 'adt_db',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    });

    try {
        await ds.initialize();
        const count = await ds.query('SELECT COUNT(*) as total FROM audit_logs');
        console.log('Total audit logs:', count[0].total);
        const last = await ds.query('SELECT TOP 5 * FROM audit_logs ORDER BY fecha DESC');
        console.log('Last 5 logs:', JSON.stringify(last, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        if (ds.isInitialized) await ds.destroy();
    }
}

check();
