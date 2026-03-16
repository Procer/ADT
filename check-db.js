
const { createConnection } = require('typeorm');
// Import with absolute paths to avoid resolution issues in the temporary script
const { User } = require('./dist/database/entities/user.entity');
const { Tenant } = require('./dist/database/entities/tenant.entity');
const { Driver } = require('./dist/database/entities/driver.entity');

async function check() {
    try {
        const connection = await createConnection({
            type: 'mssql',
            host: 'localhost',
            port: 1435,
            username: 'sa',
            password: 'StrongPassword123!',
            database: 'adt_db',
            entities: [User, Tenant, Driver],
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        });

        console.log('--- TENANTS ---');
        const tenants = await connection.manager.find(Tenant);
        console.table(tenants.map(t => ({ id: t.id, nombre: t.nombre, activo: t.activo })));

        console.log('--- USERS ---');
        const users = await connection.manager.find(User);
        console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role, tenantId: u.tenantId })));

        console.log('--- DRIVERS ---');
        const drivers = await connection.manager.find(Driver);
        console.table(drivers.map(d => ({ id: d.id, nombre: d.nombre, dni: d.dni, pin: d.pin, tenantId: d.tenantId })));

        await connection.close();
    } catch (err) {
        console.error('Error connecting to DB:', err);
    }
}

check();
