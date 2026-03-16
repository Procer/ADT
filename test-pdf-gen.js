const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tenantId = '49B0433E-F36B-1410-8A7B-00A64490CC08';
const clientId = '62B0433E-F36B-1410-8A7B-00A64490CC08';
const tripIds = ['5C12433E-F36B-1410-8A7C-00A64490CC08'];

async function testPdf() {
    try {
        console.log('--- TEST GENERACIÓN PDF PROFORMA ---');
        console.log('Llamando al endpoint /finance-v3/lotes-dador...');

        const response = await axios.post('http://localhost:3001/finance-v3/lotes-dador', {
            tenantId,
            clientId,
            tripIds
        });

        console.log('Respuesta recibida:', response.data.id);
        const lotId = response.data.id;

        const expectedPath = path.join(process.cwd(), 'storage', tenantId, 'dadores', 'proformas', `${lotId}.pdf`);
        console.log('Verificando archivo en:', expectedPath);

        if (fs.existsSync(expectedPath)) {
            console.log('--- [EXITO] PDF generado y almacenado correctamente ---');
            console.log('Ubicación:', expectedPath);
        } else {
            console.error('--- [FALLO] El archivo PDF no se encuentra en el storage ---');
        }

    } catch (err) {
        console.error('Error durante el test:', err.response?.data || err.message);
    }
}

testPdf();
