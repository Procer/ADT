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
        // Consultar el nombre de las tablas disponibles
        const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;

        const request = new Request(query, (err) => {
            if (err) console.error('Error en la consulta:', err);
            connection.close();
        });

        request.on('row', (columns) => {
            console.log('Tabla:', columns[0].value);
        });

        connection.execSql(request);
    }
});

connection.connect();
