const axios = require('axios');

async function debugKpi() {
    const tenantId = 'EBC7423E-F36B-1410-8A83-00A64490CC08'; // ID CORRECTO
    const baseUrl = 'http://localhost:3001';
    const start = '2020-01-01T00:00:00.000Z'; // Rango amplio
    const end = '2027-01-01T00:00:00.000Z';

    try {
        console.log(`[DEBUG] Llamando a /finance-v3/dashboard-kpis con tenantId: ${tenantId}`);
        const res = await axios.get(`${baseUrl}/finance-v3/dashboard-kpis`, {
            params: { tenantId, start, end }
        });
        console.log('[DEBUG] Respuesta Exitosa:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('[DEBUG] Error Detectado:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Mensaje:', err.message);
        }
    }
}

debugKpi();
