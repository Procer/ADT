
const { DataSource } = require('typeorm');

async function diag() {
    const ds = new DataSource({
        type: 'mssql',
        host: '127.0.0.1',
        port: 1499,
        username: 'sa',
        password: 'YourStrongPassword123',
        database: 'adt_db',
        options: { encrypt: true, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        console.log('--- DIAGNOSTICO DE ALERTAS ---');
        
        const gpsAlerts = await ds.query('SELECT COUNT(*) as total FROM gps_tracking WHERE fuera_de_rango = 1');
        console.log('Alertas GPS (fuera de rango):', gpsAlerts[0].total);

        const speedAudits = await ds.query("SELECT COUNT(*) as total FROM audit_logs WHERE accion = 'ALERTA_VELOCIDAD'");
        console.log('Auditorias de Velocidad:', speedAudits[0].total);

        const geofenceAudits = await ds.query("SELECT COUNT(*) as total FROM audit_logs WHERE accion = 'GEOCERCA_VIOLADA'");
        console.log('Auditorias de Geocerca:', geofenceAudits[0].total);

        const sample = await ds.query('SELECT TOP 5 accion, descripcion, fecha FROM audit_logs ORDER BY fecha DESC');
        console.log('\nUltimos 5 logs de auditoria:');
        console.table(sample);

        const gpsSample = await ds.query('SELECT TOP 5 cp_id, fuera_de_rango, resuelto FROM gps_tracking WHERE fuera_de_rango = 1');
        console.log('\nUltimos 5 GPS fuera de rango:');
        console.table(gpsSample);

        await ds.destroy();
    } catch (err) {
        console.error('Error:', err);
    }
}

diag();
