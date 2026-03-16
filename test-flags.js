const { ImapFlow } = require('imapflow');
require('dotenv').config();
const sql = require('mssql');

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

async function checkFlags() {
    try {
        await sql.connect(dbConfig);
        const res = await sql.query("SELECT * FROM tenants WHERE id = 'EBC7423E-F36B-1410-8A83-00A64490CC08'");
        const tenant = res.recordset[0];

        const client = new ImapFlow({
            host: tenant.imap_host,
            port: tenant.imap_port || 993,
            secure: true,
            auth: {
                user: tenant.imap_user,
                pass: tenant.imap_pass
            },
            logger: false // DISABLED
        });

        await client.connect();
        await client.getMailboxLock('INBOX');

        console.log("Searching for unread...");
        const messages = await client.search({ seen: false });
        console.log("Unread UIDs:", messages);

        for (const uid of messages) {
            console.log(`Setting Seen on UID ${uid}...`);
            await client.messageFlagsAdd(uid, ['\\Seen'], { useUid: true });
        }

        console.log("Searching again...");
        const messages2 = await client.search({ seen: false });
        console.log("Unread UIDs after fix:", messages2);

        await client.logout();
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkFlags();
