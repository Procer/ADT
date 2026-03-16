
const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkKeys() {
    const ds = new DataSource({
        type: 'mssql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 1433,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        const tenants = await ds.query('SELECT id, nombre_empresa, gemini_api_key, config FROM tenants');
        
        console.log('--- DIAGNÓSTICO DE API KEYS ---');
        tenants.forEach(t => {
            let config = {};
            try { config = JSON.parse(t.config || '{}'); } catch(e) {}
            
            const geminiKey = t.gemini_api_key || 'No configurada';
            const googleMapsKey = config.google_maps_api_key || config.google_api_key || 'No configurada';

            console.log(`Empresa: ${t.nombre_empresa}`);
            console.log(`- Gemini Key: ${geminiKey === 'No configurada' ? 'VACÍA' : 'Presente (' + geminiKey.substring(0, 8) + '...)'}`);
            console.log(`- Google Maps Key: ${googleMapsKey === 'No configurada' ? 'VACÍA' : 'Presente (' + googleMapsKey.substring(0, 8) + '...)'}`);

            if (geminiKey !== 'No configurada' && googleMapsKey !== 'No configurada' && geminiKey === googleMapsKey) {
                console.log('⚠️ ALERTA: Has puesto la MISMA llave en ambos campos. Esto causará errores.');
            } else if (geminiKey !== 'No configurada' && googleMapsKey !== 'No configurada') {
                console.log('✅ Las llaves son distintas. Configuración correcta.');
            }
            console.log('-----------------------------');
        });
    } catch (err) {
        console.error('Error al conectar:', err.message);
    } finally {
        await ds.destroy();
    }
}

checkKeys();
