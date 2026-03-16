const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tenantId = '49B0433E-F36B-1410-8A7B-00A64490CC08'; // ID used in existing test-pdf-gen.js

async function verifyProfitability() {
    try {
        console.log('--- TEST RENTABILIDAD DETALLADA Y PDF ---');

        // 1. Verificar KPIs detallados
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month, 0, 23, 59, 59).toISOString();

        console.log(`Consultando KPIs para ${month}/${year}...`);
        const kpiRes = await axios.get(`http://localhost:3001/finance-v3/dashboard-kpis`, {
            params: { tenantId, start, end }
        });

        const stats = kpiRes.data;
        console.log('KPIs recibidos:');
        console.log(`- Ingreso Bruto: $${stats.ingresoBruto}`);
        console.log(`- Costo Operativo: $${stats.costoOperativo}`);
        console.log(`- Viajes: ${stats.totalViajes} (${stats.newTripsCount} nuevos, ${stats.creditTripsCount} vales)`);
        console.log(`- Breakdown:`, stats.breakdown);

        if (stats.newTripsCount === undefined || stats.breakdown === undefined) {
            throw new Error('Faltan campos detallados en la respuesta de KPIs');
        }

        // 2. Verificar Generación de PDF
        console.log('\nProbando exportación a PDF...');
        const pdfRes = await axios.get(`http://localhost:3001/finance-v3/profitability/export-pdf`, {
            params: { tenantId, start, end },
            responseType: 'arraybuffer'
        });

        if (pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf') {
            const pdfPath = path.join(__dirname, 'test-profitability.pdf');
            fs.writeFileSync(pdfPath, pdfRes.data);
            console.log(`--- [ÉXITO] PDF generado correctamente en: ${pdfPath} ---`);
        } else {
            console.error('--- [FALLO] Respuesta de PDF inválida ---', pdfRes.status, pdfRes.headers['content-type']);
        }

    } catch (err) {
        console.error('Error durante la verificación:', err.response?.data?.toString() || err.message);
    }
}

verifyProfitability();
