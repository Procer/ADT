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
    console.log('Conectado a MSSQL. Consultando datos...');
    
    const query = `
        SELECT t.id, t.nombre_empresa, t.deuda_actual, 
               tp.precio_cp, tp.fecha_desde
        FROM tenants t
        LEFT JOIN tenant_pricing tp ON t.id = tp.tenant_id
        ORDER BY tp.fecha_desde DESC;
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
