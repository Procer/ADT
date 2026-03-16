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
        const tenantId = 'EBC7423E-F36B-1410-8A83-00A64490CC08'; // ID CORRECTO
        const query = `SELECT MIN(ts_creacion) as MinDate, MAX(ts_creacion) as MaxDate, COUNT(*) as Count FROM cartas_de_porte WHERE tenant_id = '${tenantId}'`;

        const request = new Request(query, (err) => {
            if (err) console.error('Error en la consulta:', err);
            connection.close();
        });

        request.on('row', (columns) => {
            console.log('Stats Correct ID:', columns.map(c => `${c.metadata.colName}: ${c.value}`).join(', '));
        });

        connection.execSql(request);
    }
});

connection.connect();
