
const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'YourStrongPassword123',
    database: 'adt_db',
    server: '127.0.0.1',
    port: 1499,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        await sql.connect(config);

        const tenantRes = await sql.query('SELECT TOP 1 id, nombre_empresa FROM tenants WHERE activo = 1');
        const tenant = tenantRes.recordset[0];
        log(`TENANT: ${tenant.nombre_empresa} (${tenant.id})`);

        const pricingRes = await sql.query(`SELECT precio_cp, fecha_desde FROM tenant_pricing WHERE tenant_id = '${tenant.id}' ORDER BY fecha_desde DESC`);
        log(`PRICINGS: ${JSON.stringify(pricingRes.recordset)}`);
        const tenantPricing = pricingRes.recordset[0]?.precio_cp || 0;

        const tripsRes = await sql.query(`
            SELECT id, numero_cp, estado, es_credito, monto_upcharge, revenue_at_execution, precio_congelado, ts_creacion, client_id
            FROM cartas_de_porte
            WHERE tenant_id = '${tenant.id}'
            AND (
                (MONTH(ts_creacion) = 3 AND YEAR(ts_creacion) = 2026)
                OR estado IN ('EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO')
            )
        `);

        log('--- MARCH 2026 / ACTIVE TRIPS ---');
        let total = 0;
        tripsRes.recordset.forEach(t => {
            let cost = 0;
            if (t.estado === 'ANULADO' || t.estado === 'VOID_CREDIT') {
                cost = 0;
            } else if (t.es_credito) {
                cost = Number(t.monto_upcharge || 0);
            } else {
                cost = Number(t.revenue_at_execution || t.precio_congelado || tenantPricing);
            }
            total += cost;
            log(`CP: ${t.numero_cp || t.id.split('-')[0]} | Fecha: ${t.ts_creacion.toISOString()} | Estado: ${t.estado} | Cred: ${t.es_credito} | Upch: ${t.monto_upcharge} | Revenue: ${t.revenue_at_execution} | Costo Calc: ${cost}`);
        });

        log(`TOTAL CALCULATED: ${total}`);

        fs.writeFileSync('finance_debug_output.txt', output);
        await sql.close();
    } catch (err) {
        fs.writeFileSync('finance_debug_output.txt', err.toString());
        console.error('Error:', err);
    }
}

check();
