const { GoogleGenerativeAI } = require("@google/generative-ai");
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrongPassword123',
    server: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '1499'),
    database: process.env.DB_NAME || 'adt_db',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function diagnostic() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT gemini_api_key FROM tenants WHERE gemini_api_key IS NOT NULL");
        const key = res.recordset[0]?.gemini_api_key;

        if (!key) {
            console.log("No se encontro ninguna clave de Gemini en la tabla tenants.");
            return;
        }

        console.log("Probando clave que empieza con:", key.substring(0, 8));
        const genAI = new GoogleGenerativeAI(key);

        const models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro",
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash"
        ];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Di 'OK' si funcionas.");
                const text = result.response.text();
                console.log(`[+] MODELO ${m}: FUNCIONA -> ${text.trim()}`);
            } catch (e) {
                console.log(`[-] MODELO ${m}: FALLA -> ${e.message}`);
            }
        }

    } catch (err) {
        console.error("DIAGNOSTIC ERROR:", err.message);
    } finally {
        await sql.close();
    }
}

diagnostic();
