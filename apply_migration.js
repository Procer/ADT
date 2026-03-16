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
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected to MSSQL to apply migration.');

    const sql = "ALTER TABLE cartas_de_porte ADD applied_rule_info NVARCHAR(255) NULL;";
    const request = new Request(sql, (err) => {
        if (err) {
            console.error('SQL error (it might already exist):', err.message);
            process.exit(0);
        } else {
            console.log('Migration applied successfully.');
            process.exit(0);
        }
    });

    connection.execSql(request);
});

connection.connect();
