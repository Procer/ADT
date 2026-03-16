const axios = require('axios');
const token = '7545078862:AAHPBq5VwX2PnIl5PWW10rGCjiswyuG9xps';

async function test() {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        console.log('--- BOT IDENTIFICADO ---');
        console.log('Username:', res.data.result.username);
        console.log('Nombre:', res.data.result.first_name);
    } catch (e) {
        console.error('--- ERROR EN EL BOT ---');
        console.error(e.response?.data || e.message);
    }
}

test();
