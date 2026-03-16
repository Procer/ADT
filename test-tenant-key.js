const sql = require('mssql');
const { GoogleGenerativeAI } = require("@google/generative-ai");
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

async function testTenantKey() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT gemini_api_key FROM tenants WHERE nombre_empresa = 'Transporte Oeste Hermanos'");
        const key = res.recordset[0]?.gemini_api_key;

        if (!key) {
            console.log("NO KEY FOUND FOR TENANT");
            return;
        }

        console.log("Testing key (truncated):", key.substring(0, 5) + "...");

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hola");
        console.log("SUCCESS:", result.response.text());

    } catch (err) {
        console.error("ERROR TESTING KEY:", err.message);
    } finally {
        await sql.close();
    }
}

testTenantKey();
