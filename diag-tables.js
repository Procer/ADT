const { DataSource } = require('typeorm');

async function listTables() {
    const ds = new DataSource({
        type: 'mssql',
        host: '127.0.0.1',
        port: 1499,
        username: 'sa',
        password: 'YourStrongPassword123',
        database: 'adt_db',
        synchronize: false,
        extra: { trustServerCertificate: true, encrypt: true }
    });

    try {
        await ds.initialize();
        const tables = await ds.query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
        console.log('Tables:', JSON.stringify(tables, null, 2));
        await ds.destroy();
    } catch (err) {
        console.error('Error:', err);
    }
}

listTables();
