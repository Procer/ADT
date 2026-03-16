const { DataSource } = require('typeorm');

async function checkData() {
    const ds = new DataSource({
        type: 'mssql', host: '127.0.0.1', port: 1499, username: 'sa', password: 'YourStrongPassword123', database: 'adt_db', synchronize: false, extra: { trustServerCertificate: true, encrypt: true }
    });

    try {
        await ds.initialize();

        const tenants = await ds.query('SELECT id, nombre_empresa FROM tenants');
        console.log('TENANTS:', JSON.stringify(tenants, null, 2));

        const allRules = await ds.query('SELECT * FROM pricing_rules');
        console.log('ALL RULES ACROSS ALL TENANTS:', JSON.stringify(allRules, null, 2));

        await ds.destroy();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkData();
