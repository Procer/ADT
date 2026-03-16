const sql = require('mssql');
const fetch = require('node-fetch');
require('dotenv').config();

const dbConfig = {
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

async function checkTenantKey() {
    try {
        await sql.connect(dbConfig);
        const res = await sql.query("SELECT gemini_api_key FROM tenants WHERE id = 'EBC7423E-F36B-1410-8A83-00A64490CC08'");
        const apiKey = res.recordset[0].gemini_api_key;

        console.log("Testing Tenant Key (truncated):", apiKey.substring(0, 10) + "...");

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.log("TENANT KEY INVALID:", data.error.message);
        } else {
            console.log("TENANT KEY IS VALID.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkTenantKey();
