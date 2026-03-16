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
        port: 1499,
        database: 'adt_db',
        encrypt: true,
        trustServerCertificate: true
    }
};

const connection = new Connection(config);

connection.on('connect', (err) => {
    if (err) {
        console.error('Error de conexión:', err);
        process.exit(1);
    } else {
        console.log('Conectado a MSSQL');
        const query = `SELECT TOP 5 tenant_id, ts_creacion, id FROM cartas_de_porte`;

        const request = new Request(query, (err) => {
            if (err) console.error('Error en la consulta:', err);
            connection.close();
        });

        request.on('row', (columns) => {
            console.log('Row:', columns.map(c => `${c.metadata.colName}: ${c.value}`).join(', '));
        });

        connection.execSql(request);
    }
});

connection.connect();
