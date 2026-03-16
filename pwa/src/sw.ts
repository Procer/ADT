/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Background Sync para eventos de viaje
self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-trip-events') {
        event.waitUntil(syncEvents());
    }
});

async function syncEvents() {
    console.log('[SW] Sincronizando eventos pendientes...');
    // Aquí implementaremos el llamado a la API para enviar eventos de la cola de IndexedDB
}

// Escuchar actualizaciones de ubicación enviadas desde la app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TRACK_LOCATION') {
        console.log('[SW] Nueva ubicación capturada:', event.data.payload);
        // Podríamos guardar en IndexedDB o intentar enviar directamente si hay red
    }
});
