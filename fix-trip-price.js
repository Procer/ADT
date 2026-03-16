const { Connection, Request } = require('tedious');

const config = {
    server: '127.0.0.1',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: 'YourStrongPassword123'
        }
    },
    options: {
        database: 'adt_db',
        port: 1499,
        encrypt: true,
        trustServerCertificate: true
    }
};

const connection = new Connection(config);

connection.on('connect', (err) => {
    if (err) {
        console.error('Error de conexion:', err);
        process.exit(1);
    }
    console.log('Conectado a MSSQL.');
    
    let totalReal = 0;

    const querySum = `
        SELECT SUM(precio_congelado + monto_upcharge) as total
        FROM cartas_de_porte
        WHERE tenant_id = '488D433E-F36B-1410-8A69-00A64490CC08'
        AND es_credito = 0
        AND (pago_confirmado = 0 OR pago_confirmado IS NULL);
    `;

    const requestSum = new Request(querySum, (err) => {
        if (err) {
            console.error('Error en suma:', err);
            connection.close();
            return;
        }
        
        console.log(`Deuda calculada real: $${totalReal}`);

        const queryUpdate = `
            UPDATE tenants 
            SET deuda_actual = ${totalReal}
            WHERE id = '488D433E-F36B-1410-8A69-00A64490CC08';
        `;

        const requestUpdate = new Request(queryUpdate, (err) => {
            if (err) console.error('Error en update:', err);
            else console.log('¡ÉXITO! Deuda corregida en la base de datos.');
            connection.close();
        });

        connection.execSql(requestUpdate);
    });

    requestSum.on('row', (columns) => {
        totalReal = columns[0].value || 0;
    });

    connection.execSql(requestSum);
});

connection.connect();
