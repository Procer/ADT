const { DataSource } = require('typeorm');

async function run() {
    const ds = new DataSource({
        type: 'mssql', host: '127.0.0.1', port: 1499, username: 'sa', password: 'YourStrongPassword123', database: 'adt_db',
        options: { encrypt: true, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        await ds.query("UPDATE drivers SET telegram_chat_id = '6935278232' WHERE dni = '12345678'");
        console.log('¡VINCULACIÓN EXITOSA! Charles Chaplin ya tiene su ID de Telegram cargado.');

        const driver = await ds.query("SELECT nombre, telegram_chat_id FROM drivers WHERE dni = '12345678'");
        console.table(driver);
    } catch (e) { console.error(e); }
    finally { await ds.destroy(); }
}

run();
