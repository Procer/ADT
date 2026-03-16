import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

export type TripStatus = 'IDLE' | 'PENDING' | 'EN_CAMINO' | 'LLEGUE' | 'CARGA_DESCARGA' | 'FINALIZADO';

interface User {
    userId: string;
    username: string;
    role: string;
    tenantId: string;
}

interface TripDetails {
    id: string;
    numeroCP: string;
    clienteNombre: string;
    destinoNombre: string;
    lat: number;
    lng: number;
}

interface TripState {
    token: string | null;
    user: User | null;
    tenantConfig: any;
    tripId: string | null;
    status: TripStatus;
    startTime: number | null;
    arrivalTime: number | null;
    entryTime: number | null;
    endTime: number | null;
    destination: { 
        lat: number; 
        lng: number; 
        name: string;
        numeroCP?: string;
        clienteNombre?: string;
    } | null;
    nextTrip: TripDetails | null;
    syncQueue: any[];
    
    setUser: (user: User | null, token: string | null, tenantConfig?: any) => void;
    setTrip: (tripId: string, destination: { 
        lat: number; 
        lng: number; 
        name: string;
        numeroCP?: string;
        clienteNombre?: string;
    }) => void;
    setNextTrip: (trip: TripDetails | null) => void;
    updateStatus: (status: TripStatus) => void;
    addToSyncQueue: (event: any) => void;
    removeFromSyncQueue: (eventId: string) => void;
    clearTrip: () => void;
}

const storage = createJSONStorage<TripState>(() => ({
    getItem: (name) => localforage.getItem(name) as Promise<string | null>,
    setItem: (name, value) => localforage.setItem(name, value) as unknown as Promise<void>,
    removeItem: (name) => localforage.removeItem(name) as Promise<void>,
}));

export const useTripStore = create<TripState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            tenantConfig: null,
            tripId: null,
            status: 'IDLE',
            startTime: null,
            arrivalTime: null,
            entryTime: null,
            endTime: null,
            destination: null,
            nextTrip: null,
            syncQueue: [],

            setUser: (user, token, tenantConfig) => set({ 
                user, 
                token,
                tenantConfig: tenantConfig || null,
                // Si cerramos sesión, limpiamos el viaje
                ...(user === null ? {
                    tripId: null,
                    status: 'IDLE',
                    startTime: null,
                    arrivalTime: null,
                    entryTime: null,
                    endTime: null,
                    destination: null,
                    nextTrip: null,
                    tenantConfig: null
                } : {})
            }),

            setTrip: (tripId, destination) => set({ 
                tripId, 
                destination, 
                // Al cargar un viaje nuevo, se queda en PENDING esperando el INICIAR VIAJE manual
                status: 'PENDING',
                startTime: null // Se seteará al darle INICIAR
            }),

            setNextTrip: (nextTrip) => set({ nextTrip }),

            updateStatus: (status) => set(() => {
                const updates: Partial<TripState> = { status };
                if (status === 'EN_CAMINO') updates.startTime = Date.now();
                if (status === 'LLEGUE') updates.arrivalTime = Date.now();
                if (status === 'CARGA_DESCARGA') updates.entryTime = Date.now();
                if (status === 'FINALIZADO') updates.endTime = Date.now();
                return updates;
            }),

            addToSyncQueue: (event) => set((state) => {
                const id = typeof crypto.randomUUID === 'function' 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2) + Date.now().toString(36);
                return {
                    syncQueue: [...state.syncQueue, { ...event, id, timestamp_dispositivo: Date.now() }]
                };
            }),

            removeFromSyncQueue: (eventId) => set((state) => ({
                syncQueue: state.syncQueue.filter(e => e.id !== eventId)
            })),

            clearTrip: () => set({
                tripId: null,
                status: 'IDLE',
                startTime: null,
                arrivalTime: null,
                entryTime: null,
                endTime: null,
                destination: null,
                nextTrip: null
            }),
        }),
        {
            name: 'trip-storage',
            storage
        }
    )
);
