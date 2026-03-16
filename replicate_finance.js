
const sql = require('mssql');

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
    try {
        await sql.connect(config);

        const tenantId = '8AF3423E-F36B-1410-8A7F-00A64490CC08';
        const m = 3;
        const y = 2026;

        const allTripsRes = await sql.query(`SELECT id, numero_cp, estado, es_credito, monto_upcharge, ts_creacion FROM cartas_de_porte WHERE tenant_id = '${tenantId}'`);
        const allTrips = allTripsRes.recordset;

        const pricingRes = await sql.query(`SELECT precio_cp, fecha_desde FROM tenant_pricing WHERE tenant_id = '${tenantId}' ORDER BY fecha_desde DESC`);
        const pricings = pricingRes.recordset;

        const getHistoricalPrice = (date) => {
            if (pricings.length === 0) return 0;
            const pricing = pricings.find(p => new Date(date) >= new Date(p.fecha_desde));
            return Number(pricing?.precio_cp || pricings[pricings.length - 1].precio_cp || 0);
        };

        const filtered = allTrips.filter(t => {
            const d = new Date(t.ts_creacion);
            const isCurrentMonth = d.getMonth() + 1 === m && d.getFullYear() === y;
            const isActive = ['EN_CAMINO', 'PENDIENTE', 'OPERANDO', 'LLEGUE', 'SOLICITADO'].includes(t.estado);
            return isCurrentMonth || isActive;
        });

        console.log('Filtered Trips Count:', filtered.length);
        let total = 0;
        filtered.forEach(t => {
            let cost = 0;
            if (t.es_credito) {
                cost = Number(t.monto_upcharge || 0);
            } else {
                cost = getHistoricalPrice(t.ts_creacion);
            }
            console.log(`CP: ${t.numero_cp} | Estado: ${t.estado} | Cost: ${cost} | Created: ${t.ts_creacion}`);
            total += cost;
        });

        console.log('TOTAL CALCULATED BY LOGIC:', total);

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}
check();
