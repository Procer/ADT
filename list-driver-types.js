
const { DataSource } = require('typeorm');

async function listColumnTypes() {
    const ds = new DataSource({
        type: "mssql",
        host: "localhost", port: 1433, username: "sa", password: "YourPassword123",
        database: "adt_db", options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        const res = await ds.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'drivers'
        `);
        console.table(res);
    } catch (err) {
        console.error(err);
    } finally {
        await ds.destroy();
    }
}
listColumnTypes();
