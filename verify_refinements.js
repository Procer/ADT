const axios = require('axios');

const API_URL = 'http://localhost:3001';
const tenantId = 'EBC7423E-F36B-1410-8A83-00A64490CC08';

async function verify() {
    try {
        console.log('Verificando creación de viaje con transparencia de tarifas...');

        const payload = {
            tenantId,
            choferId: 'EBC7423E-F36B-1410-8A87-00A64490CC08', // Driver real
            unidadId: 'EBC7423E-F36B-1410-8A89-00A64490CC08', // Unit real
            clientId: 'EBC7423E-F36B-1410-8A85-00A64490CC08', // Client real
            destinoNombre: 'Puerto Madero, CABA',
            destinoLat: -34.6111,
            destinoLng: -58.3611,
            mercaderiaTipo: 'General',
            pesoToneladas: 28.5,
            distanciaKm: 450,
            adminNameBypass: 'Antigravity Test'
        };

        const res = await axios.post(`${API_URL}/trips`, payload);
        const trip = res.data;

        console.log('Viaje creado:', trip.numeroCP);
        console.log('Applied Rule Info:', trip.appliedRuleInfo);

        if (trip.appliedRuleInfo) {
            console.log('SUCCESS: Transparency working.');
        } else {
            console.log('FAILURE: Missing rule info.');
        }

        console.log('\nVerificando KPIs de Rentabilidad...');
        const resKpi = await axios.get(`${API_URL}/finance-v3/dashboard-kpis?tenantId=${tenantId}`);
        console.log('Breakdown:', resKpi.data.breakdown);
        console.log('Counts:', resKpi.data.newTripsCount, 'Nuevos,', resKpi.data.creditTripsCount, 'Vales');

        if (resKpi.data.breakdown.platformFees > 0) {
            console.log('SUCCESS: Platform fees (ADT Cost) are being calculated.');
        } else {
            console.warn('WARNING: Platform fees are still $0. Check if testing tenant has precio_congelado set in trips.');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
        }
    }
}

verify();
