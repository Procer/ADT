import { useEffect, useRef } from 'react';
import { useTripStore } from '../store/useTripStore';
import axios from 'axios';
import { API_BASE_URL } from '../config';


export function useSyncQueue() {
    const { syncQueue, removeFromSyncQueue, tripId, token } = useTripStore();
    const isSyncing = useRef(false);

    useEffect(() => {
        const sync = async () => {
            // Evitar ejecuciones paralelas o si la cola está vacía
            if (isSyncing.current || syncQueue.length === 0 || !navigator.onLine) return;

            isSyncing.current = true;

            // Procesar una copia local para evitar interferencias con el estado de Zustand durante el loop
            const queueSnapshot = [...syncQueue];

            // Configurar headers si hay token
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            for (const event of queueSnapshot) {
                try {
                    let endpoint = '';
                    let payload: any = {};

                    if (event.type === 'GPS_PING') {
                        endpoint = `${API_BASE_URL}/trips/ping`;
                        payload = {
                            cpId: tripId,
                            lat: event.coords.latitude,
                            lng: event.coords.longitude,
                            speed: event.speed,
                            timestamp: new Date(event.timestamp_dispositivo).toISOString(),
                            tipo_registro: event.tipo_registro || 'AUTOMATICO',
                            cierre_interno_disparado: event.cierre_interno_disparado || false,
                            kilometers: event.kilometers,
                            metadata: event.metadata || ''
                        };
                    } else if (event.type.startsWith('STATUS_CHANGE_')) {
                        const newStatus = event.type.replace('STATUS_CHANGE_', '');
                        endpoint = `${API_BASE_URL}/trips/${tripId}/status`;

                        // Mapeo dinámico para compatibilidad backend (Spanish)
                        const mappedStatus = newStatus === 'PENDING' ? 'PENDIENTE' : newStatus;

                        payload = {
                            estado: mappedStatus,
                            lat: event.coords?.lat || event.coords?.latitude,
                            lng: event.coords?.lng || event.coords?.longitude,
                            fuera_de_rango: event.fuera_de_rango || false,
                            timestamp: new Date(event.timestamp_dispositivo).toISOString(),
                            tipo_registro: event.tipo_registro || 'MANUAL',
                            evento_manual: event.evento_manual || newStatus
                        };
                    } else if (event.type === 'PHOTO_UPLOAD') {
                        removeFromSyncQueue(event.id);
                        continue;
                    }

                    if (endpoint) {
                        try {
                            if (event.type.startsWith('STATUS_CHANGE_')) {
                                await axios.patch(endpoint, payload, { headers });
                            } else {
                                await axios.post(endpoint, payload, { headers });
                            }
                            removeFromSyncQueue(event.id);
                        } catch (error: any) {
                            const status = error.response?.status;
                            if (status === 401) {
                                console.error(`[SyncQueue] Token expirado (401). Pausando sincronización y forzando login.`);
                                useTripStore.getState().setUser(null, null);
                                break;
                            }
                            if (status === 404 || status === 400) {
                                console.warn(`[SyncQueue] Descartando evento ${event.type} por error ${status}`, error.response?.data);
                                removeFromSyncQueue(event.id);
                                continue;
                            }
                            throw error;
                        }
                    }
                } catch (error: any) {
                    // Si hay error de red, detenemos el procesamiento de la cola
                    break;
                }
            }
            isSyncing.current = false;
        };

        const interval = setInterval(sync, 5000);
        window.addEventListener('online', sync);
        sync();

        return () => {
            window.removeEventListener('online', sync);
            clearInterval(interval);
        };
    }, [syncQueue.length, removeFromSyncQueue, tripId, token]);
}
