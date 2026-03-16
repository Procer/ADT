import { openDB } from 'idb';

const DB_NAME = 'adt-pwa-db';
const STORE_NAME = 'pings-queue';

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
}

export async function addPingToQueue(ping: any) {
    const db = await initDB();
    return db.add(STORE_NAME, ping);
}

export async function getAllQueuedPings() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}

export async function clearPingFromQueue(id: number) {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
}
