const axios = require('axios');
const token = '7545078862:AAHPBq5VwX2PnIl5PWW10rGCjiswyuG9xps';
const chatId = '6935278232';

async function test() {
    try {
        const message = "🔔 *PRUEBA DE CONEXIÓN ADT*\nEste mensaje confirma que tu Telegram está vinculado correctamente.";
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('--- PRUEBA ENVIADA ---');
    } catch (e) {
        console.error('ERROR:', e.response?.data || e.message);
    }
}

test();
