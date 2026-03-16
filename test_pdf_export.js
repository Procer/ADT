const axios = require('axios');
const fs = require('fs');

async function testPdf() {
    const tenantId = '49B0433E-F36B-1410-8A7B-00A64490CC08';
    const baseUrl = 'http://localhost:3001';
    const start = '2020-01-01T00:00:00.000Z'; // Rango amplio
    const end = '2027-01-01T00:00:00.000Z';

    try {
        console.log(`[PDF DEBUG] Llamando a /finance-v3/profitability/export-pdf`);
        const res = await axios.get(`${baseUrl}/finance-v3/profitability/export-pdf`, {
            params: { tenantId, start, end },
            responseType: 'arraybuffer'
        });

        console.log('[PDF DEBUG] Status:', res.status);
        console.log('[PDF DEBUG] Content-Type:', res.headers['content-type']);
        console.log('[PDF DEBUG] Content-Length:', res.headers['content-length']);

        if (res.headers['content-type'] === 'application/pdf') {
            fs.writeFileSync('test_export_result.pdf', res.data);
            console.log('[PDF DEBUG] Archivo guardado como test_export_result.pdf');
        } else {
            console.log('[PDF DEBUG] Los datos no son un PDF:', res.data.toString());
        }
    } catch (err) {
        console.error('[PDF DEBUG] Error Detectado:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data.toString());
        } else {
            console.error('Mensaje:', err.message);
        }
    }
}

testPdf();
