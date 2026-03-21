import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTripStore, type TripStatus } from '../store/useTripStore';
import { useSyncQueue } from '../hooks/useSyncQueue';
import {
    Play, CheckCircle, Truck, Camera, LogOut, User,
    MapPin, Navigation, ChevronRight, Activity, Home, Map as MapIcon, Send,
    ShieldCheck, Clock
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { Login } from './Login';
import { logToBackend } from '../logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateETA = (distanceMeters: number | null, speedMs: number | null) => {
    if (distanceMeters === null) return 'Calculando...';
    if (distanceMeters < 100) return 'Llegó';

    // Velocidad promedio logística: 45km/h = 12.5 m/s
    const speed = (speedMs && speedMs > 2) ? speedMs : 12.5;
    const seconds = distanceMeters / speed;

    if (seconds < 60) return 'Inminente';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

export const DriverApp: React.FC = () => {
    useSyncQueue();
    const {
        status,
        tripId,
        destination,
        nextTrip,
        startTime,
        arrivalTime,
        entryTime,
        endTime,
        tenantConfig,
        setTrip,
        setNextTrip,
        updateStatus,
        addToSyncQueue,
        clearTrip,
        token,
        user,
        setUser
    } = useTripStore();

    const geofenceThreshold = useMemo(() => {
        return tenantConfig?.geocerca_mts || 3000;
    }, [tenantConfig]);

    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [loadingTrip, setLoadingTrip] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [activeTab, setActiveTab] = useState<'home' | 'map' | 'telegram'>('home');
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'info' | 'error' | 'success' } | null>(null);
    const watchId = useRef<number | null>(null);

    const handleTabChange = (tab: 'home' | 'map' | 'telegram') => {
        setActiveTab(tab);
        logToBackend('INFO', `Cambio de pestaña: ${tab}`);
    };

    const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Timer para estadía
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const etaSmart = useMemo(() => {
        const activeStates = ['PENDING', 'EN_CAMINO', 'LLEGUE', 'ENTREGADO'];
        if (!activeStates.includes(status)) return '---';
        return calculateETA(distance, location?.speed || null);
    }, [distance, location, status]);

    const milestones = useMemo(() => {
        const list = [];
        if (startTime) list.push({ label: 'Inicio Viaje', time: startTime, icon: <Play size={14} /> });
        if (arrivalTime) list.push({ label: 'Llegada', time: arrivalTime, icon: <CheckCircle size={14} /> });
        if (entryTime) list.push({ label: 'Ingreso a Sitio', time: entryTime, icon: <Truck size={14} /> });
        if (status === 'ENTREGADO') list.push({ label: 'En Destino (Auto)', time: Date.now(), icon: <MapPin size={14} /> });
        if (endTime) list.push({ label: 'Finalizado', time: endTime, icon: <ShieldCheck size={14} /> });
        return list.sort((a, b) => b.time - a.time);
    }, [startTime, arrivalTime, entryTime, endTime, status]);

    const stayDuration = useMemo(() => {
        if (!arrivalTime || status === 'FINALIZADO') return '00:00:00';
        const diff = Math.floor((currentTime - arrivalTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }, [arrivalTime, currentTime, status]);

    const triggerHaptic = (style: 'light' | 'heavy' = 'light') => {
        if ('vibrate' in navigator) {
            navigator.vibrate(style === 'heavy' ? [100, 50, 100] : 50);
        }
    };

    // Wake Lock
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && (status !== 'IDLE' && status !== 'FINALIZADO')) {
                try {
                    const lock = await navigator.wakeLock.request('screen');
                    setWakeLock(lock);
                } catch (err) {
                    console.error('Wake Lock error:', err);
                }
            } else if (wakeLock) {
                wakeLock.release();
                setWakeLock(null);
            }
        };
        requestWakeLock();
    }, [status]);

    // Data FetchING
    useEffect(() => {
        const fetchTrips = async () => {
            if (!token) return;
            setLoadingTrip(true);
            try {
                const activeRes = await axios.get(`${API_BASE_URL}/trips/active/driver`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (activeRes.data) {
                    const t = activeRes.data;
                    if (status === 'IDLE' || t.id !== tripId) {
                        setTrip(t.id, {
                            lat: t.destinoLat || 0,
                            lng: t.destinoLng || 0,
                            name: t.destinoNombre || 'Destino',
                            numeroCP: t.numeroCP,
                            clienteNombre: t.client?.nombreRazonSocial || 'Dador de Carga',
                            mileage: t.distanciaTotalRecorridaKm || 0
                        });
                    }
                } else {
                    // SI EL SERVIDOR NO DEVUELVE VIAJE ACTIVO Y NOSOTROS TENEMOS UNO:
                    // Significa que fue cancelado o finalizado administrativamente.
                    if (status !== 'IDLE' && status !== 'FINALIZADO') {
                        console.log('[DriverApp] El viaje ya no está activo en el servidor. Limpiando...');
                        clearTrip();
                    }
                }

                const queueRes = await axios.get(`${API_BASE_URL}/trips/queue`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (queueRes.data && queueRes.data.length > 0) {
                    const upcoming = queueRes.data.find((q: any) => q.id !== tripId);
                    if (upcoming) {
                        setNextTrip({
                            id: upcoming.id,
                            numeroCP: upcoming.numeroCP,
                            clienteNombre: upcoming.client?.nombreRazonSocial || 'Dador de Carga',
                            destinoNombre: upcoming.destinoNombre,
                            lat: upcoming.destinoLat,
                            lng: upcoming.destinoLng
                        });
                    } else setNextTrip(null);
                } else setNextTrip(null);

            } catch (err: any) {
                console.error('[DriverApp] Error fetching trips:', err.message);
            } finally {
                setLoadingTrip(false);
            }
        };
        fetchTrips();
    }, [token, tripId]);

    // BACKGROUND TRACKING & DUAL LOGGING
    useEffect(() => {
        if (status !== 'IDLE' && status !== 'FINALIZADO') {
            const startTracking = (high: boolean) => {
                if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
                watchId.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude, longitude, speed } = pos.coords;
                        setLocation(pos.coords);
                        setGpsError(null);

                        let currentDist = 0;
                        if (destination) {
                            currentDist = calculateDistance(latitude, longitude, destination.lat, destination.lng);
                            setDistance(currentDist);
                        }

                        // REGLA: Cierre Interno por alejamiento (> 10km del destino)
                        if (currentDist > 10000 && (status === 'EN_CAMINO' || status === 'LLEGUE')) {
                            addToSyncQueue({
                                type: 'GPS_PING',
                                coords: { latitude, longitude },
                                speed: speed || 0,
                                timestamp_dispositivo: Date.now(),
                                cierre_interno_disparado: true,
                                metadata: JSON.stringify({ event: 'ALEJAMIENTO_10KM', battery: 'unknown' })
                            });
                        } else {
                            // REGISTRO AUTOMÁTICO (Dual Tracking)
                            addToSyncQueue({
                                type: 'GPS_PING',
                                coords: { latitude, longitude },
                                speed: speed || 0,
                                timestamp_dispositivo: Date.now(),
                                tipo_registro: 'AUTOMATICO'
                            });
                        }

                        const isMoving = (speed || 0) * 3.6 > 5;
                        if (isMoving && !high) startTracking(true);
                        else if (!isMoving && high) startTracking(false);
                    },
                    (err) => {
                        console.error('GPS Error:', err);
                        setGpsError(err.code === 1 ? 'Permiso GPS denegado' : 'Error GPS');
                        logToBackend('ERROR', `Error GPS: ${err.message}`, { code: err.code });
                    },
                    { enableHighAccuracy: high, timeout: 20000, maximumAge: 10000 }
                );
            };
            startTracking(true);
        } else if (watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
        }
        return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
    }, [status, destination]);

    const handleAction = async (nextStatus: TripStatus) => {
        triggerHaptic('heavy');
        setLoadingTrip(true);
        logToBackend('INFO', `Acción Chofer: ${nextStatus}`, { tripId });

        let coords = location ? { lat: location.latitude, lng: location.longitude } : null;

        // Si no hay coordenadas, intentamos forzar una lectura actual
        if (!coords) {
            try {
                showToast('Obteniendo ubicación precisa...', 'info');
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(pos.coords);
            } catch (err) {
                console.warn('Could not force location for action', err);
                showToast('Ubicación no disponible, verifique GPS', 'error');
            }
        }

        let payload: any = {
            type: `STATUS_CHANGE_${nextStatus}`,
            coords: coords,
            timestamp_dispositivo: Date.now(),
            tipo_registro: 'MANUAL',
            evento_manual: nextStatus
        };

        // Auditoría de discrepancia dinámica
        const hitosCriticos = ['LLEGUE', 'CARGA_DESCARGA', 'FINALIZADO'];
        if (hitosCriticos.includes(nextStatus) && distance !== null && distance > geofenceThreshold) {
            payload.fuera_de_rango = true;
        }

        addToSyncQueue(payload);
        updateStatus(nextStatus);
        setLoadingTrip(false);
        showToast(`Estado: ${nextStatus.replace('_', ' ')}`, 'success');
    };

    const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            triggerHaptic('heavy');
            await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true });

            // Marca de agua en nombre de archivo (Metadatos visuales)
            const watermark = `CP-${destination?.numeroCP}_LAT-${location?.latitude.toFixed(4)}_LNG-${location?.longitude.toFixed(4)}_TIME-${new Date().toISOString()}`;

            addToSyncQueue({
                type: 'PHOTO_UPLOAD',
                timestamp_dispositivo: Date.now(),
                fileName: `${watermark}_${file.name}`,
                tipo_registro: 'MANUAL',
                evento_manual: 'FINALIZAR'
            });
            handleAction('FINALIZADO');
        } catch (error) {
            console.error('Image error:', error);
        }
    };

    const openNavigation = () => {
        if (!destination) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
        window.open(url, '_blank');
    };

    if (!token) return <Login />;

    return (
        <div className="min-h-screen bg-[#F8F9FC] text-[#1e1b4b] flex flex-col font-sans relative overflow-hidden transition-all duration-500 pb-24">

            {/* Header: Clean & Modern */}
            <header className="sticky top-0 z-50 w-full flex items-center justify-between py-4 px-6 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <User size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-bold text-[#1e1b4b] leading-none mb-1">{user?.username || 'Conductor'}</h1>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`} />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{navigator.onLine ? 'Online' : 'Offline'}</p>

                            <div className="w-px h-3 bg-slate-200 mx-1" />

                            <div className={`w-2 h-2 rounded-full ${location ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {gpsError ? gpsError : (location ? 'GPS OK' : 'GPS Buscando')}
                            </p>
                        </div>
                    </div>
                </div>
                <button onClick={() => setUser(null, null)} className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-all active:scale-90">
                    <LogOut size={20} />
                </button>
            </header>

            {/* Toasts */}
            {toast && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 duration-300 border ${toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                    <Activity size={18} className={toast.type === 'error' ? 'text-rose-500' : 'text-indigo-500'} />
                    <p className="text-sm font-black uppercase tracking-tight">{toast.message}</p>
                </div>
            )}

            <main className="flex-1 w-full flex flex-col p-5 gap-6 max-w-lg mx-auto overflow-y-auto">

                {activeTab === 'telegram' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-[#0088cc]/10 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-[#0088cc]/20 border border-[#0088cc]/20">
                            <Send size={48} className="text-[#0088cc]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1e1b4b] mb-4">Vincular Telegram</h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                            Vincule su cuenta para recibir notificaciones de viajes, alertas y resúmenes directamente en su celular.
                        </p>

                        <div className="w-full space-y-4 mb-10">
                            <div className="flex items-start gap-4 text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs flex-shrink-0">1</div>
                                <p className="text-xs font-bold text-[#1e1b4b] leading-snug">Pulse el botón inferior para abrir el chat con el bot de ANKA.</p>
                            </div>
                            <div className="flex items-start gap-4 text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs flex-shrink-0">2</div>
                                <p className="text-xs font-bold text-[#1e1b4b] leading-snug">Envíe su número de <span className="text-indigo-600">DNI</span> (solo números) al chat.</p>
                            </div>
                            <div className="flex items-start gap-4 text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs flex-shrink-0">3</div>
                                <p className="text-xs font-bold text-[#1e1b4b] leading-snug">¡Listo! Recibirá un mensaje de confirmación.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                logToBackend('INFO', 'Click en Abrir Telegram');
                                window.open('https://t.me/Anka_System_Bot', '_blank');
                            }}
                            className="w-full py-5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-xl shadow-[#0088cc]/30"
                        >
                            <Send size={24} fill="currentColor" />
                            Abrir Telegram
                        </button>
                    </div>
                ) : activeTab === 'map' ? (
                    <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-right-10 duration-500">
                        <div className="w-full h-full min-h-[400px] bg-slate-200 rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl relative">
                            {location ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                                    allowFullScreen
                                    className="grayscale-[20%] brightness-[110%]"
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Obteniendo señal GPS...</p>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    if (location) {
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination?.lat},${destination?.lng}&origin=${location.latitude},${location.longitude}`, '_blank');
                                    }
                                }}
                                className="absolute bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl active:scale-90 transition-all flex items-center gap-2"
                            >
                                <Navigation size={24} />
                                <span className="font-bold text-sm">Navegar</span>
                            </button>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity size={18} className="text-indigo-500" />
                                <h4 className="text-sm font-black text-[#1e1b4b] uppercase tracking-tight">Coordenadas Reales</h4>
                            </div>
                            <p className="text-[11px] font-mono text-slate-500">
                                LAT: {location?.latitude.toFixed(6) || '---'} | LNG: {location?.longitude.toFixed(6) || '---'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Status Bar */}
                        {(status !== 'IDLE' && status !== 'FINALIZADO') && (
                            <div className="flex items-center justify-between px-1 animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest">
                                    {status.replace('_', ' ')}
                                </div>
                                {status === 'CARGA_DESCARGA' && (
                                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-2 font-mono">
                                        <Clock size={12} /> {stayDuration}
                                    </div>
                                )}
                            </div>
                        )}

                        {loadingTrip && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</p>
                            </div>
                        )}

                        {/* IDLE STATE */}
                        {status === 'IDLE' && !loadingTrip && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 space-y-8">
                                <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(99,102,241,0.2)] border border-indigo-50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-transparent opacity-50" />
                                    <Truck size={56} className="text-indigo-600 relative z-10" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-[#1e1b4b]">Sin Viaje Asignado</h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                                        Permanece atento. Tu próxima ruta aparecerá aquí automáticamente.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ACTIVE TRIP MAP & CARD */}
                        {(status === 'PENDING' || status === 'EN_CAMINO' || status === 'LLEGUE' || status === 'CARGA_DESCARGA') && destination && (
                            <div className="space-y-6">
                                {/* Map Mini (Simulated Interactive Map) */}
                                <div className="w-full h-40 bg-slate-200 rounded-[32px] overflow-hidden relative shadow-inner border border-slate-200">
                                    {location ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                                            className="grayscale-[30%] opacity-80"
                                        ></iframe>
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                                            <MapIcon size={32} className="text-slate-300 animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                {/* Trip Details Card */}
                                <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-indigo-100 border border-white space-y-6 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                                                CP #{destination.numeroCP}
                                            </span>
                                            <h3 className="text-2xl font-black text-[#1e1b4b] leading-tight mt-2">{destination.clienteNombre}</h3>
                                        </div>
                                        <ShieldCheck size={24} className="text-indigo-200" />
                                    </div>

                                    <div className="flex items-start gap-3 relative z-10">
                                        <MapPin size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-semibold text-slate-600 leading-snug">{destination.name}</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-10">
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Faltante</p>
                                            <p className="text-lg font-black text-[#1e1b4b]">
                                                {distance ? `${(distance / 1000).toFixed(1)}` : '---'} <span className="text-[10px]">km</span>
                                            </p>
                                        </div>
                                        <div className="text-center border-x border-slate-200">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Recorrido</p>
                                            <p className="text-lg font-black text-indigo-600">
                                                {destination?.mileage ? Number(destination.mileage).toFixed(1) : '0.0'} <span className="text-[10px]">km</span>
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">ETA Smart</p>
                                            <p className="text-lg font-black text-[#1e1b4b]">{etaSmart}</p>
                                        </div>
                                    </div>

                                    {/* Timeline de Hitos */}
                                    {milestones.length > 0 && (
                                        <div className="pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Activity size={14} className="text-indigo-400" />
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hitos del Viaje</h4>
                                            </div>
                                            <div className="space-y-4">
                                                {milestones.map((m, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                                            {m.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-[#1e1b4b]">{m.label}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">
                                                                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                                                Reciente
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SINGLE ACTION BUTTON (Hero Button 64px+) */}
                        <div className="fixed bottom-24 left-0 w-full px-6 z-40 pointer-events-none">
                            <div className="max-w-lg mx-auto pointer-events-auto">
                                {status === 'PENDING' && (
                                    <button
                                        onClick={() => handleAction('EN_CAMINO')}
                                        className="w-full h-20 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/40 active:scale-[0.96] transition-all font-black text-xl uppercase tracking-wider group"
                                    >
                                        <Play size={28} fill="currentColor" className="group-active:scale-110 transition-transform" />
                                        Iniciar Viaje
                                    </button>
                                )}
                                {status === 'EN_CAMINO' && (
                                    <button
                                        onClick={() => handleAction('LLEGUE')}
                                        className="w-full h-20 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/40 active:scale-[0.96] transition-all font-black text-xl uppercase tracking-wider group"
                                    >
                                        <CheckCircle size={28} className="group-active:scale-110 transition-transform" />
                                        Confirmar Llegada
                                    </button>
                                )}
                                {status === 'LLEGUE' && (
                                    <button
                                        onClick={() => handleAction('CARGA_DESCARGA')}
                                        className="w-full h-20 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/40 active:scale-[0.96] transition-all font-black text-xl uppercase tracking-wider group"
                                    >
                                        <Truck size={28} className="group-active:scale-110 transition-transform" />
                                        Entrar a Sitio
                                    </button>
                                )}
                                {(status === 'CARGA_DESCARGA' || status === 'ENTREGADO') && (
                                    <button
                                        onClick={async () => {
                                            const wantsPhoto = window.confirm('¿Desea adjuntar una foto del remito/evidencia antes de finalizar?');
                                            if (wantsPhoto) {
                                                document.getElementById('photo-input')?.click();
                                            } else {
                                                handleAction('FINALIZADO');
                                            }
                                        }}
                                        className="w-full h-20 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-500/40 active:scale-[0.96] transition-all font-black text-xl uppercase tracking-wider group"
                                    >
                                        <Camera size={28} className="group-active:scale-110 transition-transform" />
                                        Finalizar Viaje
                                        <input
                                            id="photo-input"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handlePhotoCapture}
                                        />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Queue Card */}
                        {nextTrip && (status !== 'IDLE' && status !== 'FINALIZADO') && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm active:scale-95 transition-all mb-20">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-sm">
                                        +1
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Próxima Misión</p>
                                        <p className="text-sm font-bold text-[#1e1b4b] leading-none">{nextTrip.clienteNombre}</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300" />
                            </div>
                        )}

                        {status === 'FINALIZADO' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-10 animate-in zoom-in-95 duration-500">
                                <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mb-8 border border-emerald-100 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]">
                                    <CheckCircle size={56} className="text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-black text-[#1e1b4b] mb-4 uppercase tracking-tight">Misión Cumplida</h2>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-12">
                                    Auditoría de cierre completada correctamente.<br />
                                    <span className="text-emerald-600 font-bold">Datos sincronizados con central.</span>
                                </p>
                                <button onClick={() => {
                                    logToBackend('INFO', 'Click en Continuar tras finalizar viaje');
                                    clearTrip();
                                }} className="w-full py-5 bg-[#1e1b4b] text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-xl">
                                    Continuar
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 px-8 pb-6 pt-4 flex justify-between items-center z-50 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => handleTabChange('home')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-[#6366f1]' : 'text-slate-400'}`}
                >
                    <Home size={24} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => {
                        handleTabChange('map');
                        if (location && destination) {
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&origin=${location.latitude},${location.longitude}`, '_blank');
                        } else if (location) {
                            window.open(`https://www.google.com/maps/@${location.latitude},${location.longitude},15z`, '_blank');
                        } else {
                            showToast('Ubicación no disponible para navegar.', 'error');
                        }
                    }}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'map' ? 'text-[#6366f1]' : 'text-slate-400'}`}
                >
                    <MapIcon size={24} fill={activeTab === 'map' ? 'currentColor' : 'none'} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => handleTabChange('telegram')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'telegram' ? 'text-[#6366f1]' : 'text-slate-400'}`}
                >
                    <Send size={24} fill={activeTab === 'telegram' ? 'currentColor' : 'none'} strokeWidth={2.5} />
                </button>
            </nav>
        </div>
    );
};