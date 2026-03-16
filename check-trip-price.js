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
    console.log('Conectado a MSSQL. Consultando viajes...');
    
    const query = `
        SELECT id, numero_cp, precio_congelado, monto_upcharge, es_credito, ts_creacion, estado
        FROM cartas_de_porte
        WHERE tenant_id = '488D433E-F36B-1410-8A69-00A64490CC08'
        ORDER BY ts_creacion DESC;
    `;

    const request = new Request(query, (err) => {
        if (err) {
            console.error('Error en query:', err);
        }
        connection.close();
    });

    request.on('row', (columns) => {
        const row = {};
        columns.forEach((column) => {
            row[column.metadata.colName] = column.value;
        });
        console.log(JSON.stringify(row, null, 2));
    });

    connection.execSql(request);
});

connection.connect();
