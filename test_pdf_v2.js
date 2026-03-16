const axios = require('axios');
const fs = require('fs');

async function testPdfV2() {
    const tenantId = 'EBC7423E-F36B-1410-8A83-00A64490CC08'; // ID CORRECTO
    const baseUrl = 'http://localhost:3001';
    const start = '2020-01-01T00:00:00.000Z'; // Rango amplio
    const end = '2027-01-01T00:00:00.000Z';

    try {
        console.log(`[PDF DEBUG] Llamando a /finance-v3/profitability/export-pdf con ID CORRECTO`);
        const res = await axios.get(`${baseUrl}/finance-v3/profitability/export-pdf`, {
            params: { tenantId, start, end },
            responseType: 'arraybuffer'
        });

        console.log('[PDF DEBUG] Status:', res.status);
        console.log('[PDF DEBUG] Content-Type:', res.headers['content-type']);

        if (res.headers['content-type'] === 'application/pdf') {
            fs.writeFileSync('reporte_rentabilidad_real.pdf', res.data);
            console.log('[PDF DEBUG] Archivo guardado como reporte_rentabilidad_real.pdf');
        } else {
            console.log('[PDF DEBUG] Error: La respuesta no es un PDF');
        }
    } catch (err) {
        console.error('[PDF DEBUG] Error Detectado:', err.message);
    }
}

testPdfV2();
