const { Client } = require('pg');

async function cleanup() {
    const client = new Client({
        user: process.env.DB_USERNAME || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'adt_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    });

    try {
        await client.connect();
        console.log('Connected to DB. Dropping conflicting tables...');
        await client.query('DROP TABLE IF EXISTS tenant_pricing CASCADE');
        await client.query('DROP TABLE IF EXISTS gps_tracking CASCADE');
        await client.query('DROP TABLE IF EXISTS cartas_de_porte CASCADE');
        await client.query('DROP TABLE IF EXISTS audit_logs CASCADE');
        console.log('Tables dropped successfully.');
    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        await client.end();
    }
}

cleanup();
