const axios = require('axios');

async function debugKpi() {
    const tenantId = '49B0433E-F36B-1410-8A7B-00A64490CC08';
    const baseUrl = 'http://localhost:3001';

    try {
        console.log(`[DEBUG] Llamando a /finance-v3/dashboard-kpis con tenantId: ${tenantId}`);
        const res = await axios.get(`${baseUrl}/finance-v3/dashboard-kpis`, {
            params: { tenantId }
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
