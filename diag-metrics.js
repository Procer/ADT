const mssql = require('mssql');
const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    server: 'localhost',
    database: 'adt_db',
    port: 1499,
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await mssql.connect(config);
        const tRes = await mssql.query("SELECT id, nombre_empresa, deuda_actual FROM tenants WHERE nombre_empresa LIKE '%Transporte Oeste%'");
        if (tRes.recordset.length === 0) {
            console.log('No encontrado');
            return;
        }
        const tenant = tRes.recordset[0];
        const tid = tenant.id;

        const cRes = await mssql.query(`SELECT COUNT(*) as realizados, SUM(CASE WHEN es_credito = 1 THEN 1 ELSE 0 END) as pagados_vales, SUM(CASE WHEN pago_confirmado = 0 THEN 1 ELSE 0 END) as a_cobrar FROM cartas_de_porte WHERE tenant_id = '${tid}' AND MONTH(ts_creacion) = 2 AND YEAR(ts_creacion) = 2026`);
        const wRes = await mssql.query(`SELECT SUM(saldo_creditos) as disponibles FROM billetera_saldos WHERE tenant_id = '${tid}'`);

        console.log('--- RESULTADO ---');
        console.log('EMPRESA:', tenant.nombre_empresa);
        console.log('DEUDA ACTUAL (Base de datos):', tenant.deuda_actual);
        console.log('VIAJES REALIZADOS (Feb):', cRes.recordset[0].realizados);
        console.log('PAGADOS CON VALES (Feb):', cRes.recordset[0].pagados_vales);
        console.log('VIAJES A COBRAR (Feb):', cRes.recordset[0].a_cobrar);
        console.log('VALES DISPONIBLES (Total):', wRes.recordset[0].disponibles);

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}
run();
