const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const sql = require('mssql');
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

async function debugIngestion() {
    try {
        await sql.connect(dbConfig);
        const res = await sql.query("SELECT * FROM tenants WHERE id = 'EBC7423E-F36B-1410-8A83-00A64490CC08'");
        const tenant = res.recordset[0];

        if (!tenant) {
            console.log("Tenant not found");
            return;
        }

        const client = new ImapFlow({
            host: tenant.imap_host,
            port: tenant.imap_port || 993,
            secure: true,
            auth: {
                user: tenant.imap_user,
                pass: tenant.imap_pass
            },
            logger: false
        });

        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            const messages = await client.search({ seen: false });
            console.log(`Found ${messages.length} unread messages.`);

            for (const uid of messages) {
                const { content } = await client.download(uid);
                const parsed = await simpleParser(content);
                const subject = parsed.subject;
                const from = parsed.from.value[0].address;

                console.log(`- UID ${uid}: From ${from}, Subject: "${subject}"`);

                // Try marking as seen
                await client.messageFlagsAdd({ uid }, ['\\Seen']);
                console.log(`  Marked UID ${uid} as Seen.`);
            }
        } finally {
            lock.release();
        }
        await client.logout();
    } catch (err) {
        console.error("DEBUG ERROR:", err);
    } finally {
        await sql.close();
    }
}

debugIngestion();
