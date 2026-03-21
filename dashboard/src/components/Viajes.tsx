import { Search, Plus, Filter, Navigation, X, Layers, User, Truck, MapPin, Package, ArrowRight, Save, Receipt, Calendar, Clock, Map as MapIcon, XCircle, Gauge, Weight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import VisualHelpCard from './common/VisualHelpCard';
import VisualTourOverlay from './common/VisualTourOverlay';
import LogViaje from './LogViaje';
import { useNotification } from '../App';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'PENDIENTE': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', label: 'PENDIENTE' };
        case 'EN_CAMINO': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', label: 'EN CAMINO' };
        case 'LLEGUE': return { bg: 'rgba(234, 179, 8, 0.1)', color: '#facc15', label: 'LLEGUE' };
        case 'OPERANDO': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', label: 'OPERANDO' };
        case 'FINALIZADO': return { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.4)', label: 'FINALIZADO' };
        case 'ANULADO': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', label: 'ANULADO' };
        case 'SOLICITADO': return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', label: 'SOLICITADO' };
        default: return { bg: 'rgba(255,255,255,0.05)', color: 'white', label: status };
    }
};

export default function Viajes({ tenantId }: { tenantId: string | null }) {
    const { notify } = useNotification();
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formTab, setFormTab] = useState<'logistica' | 'carga'>('logistica');
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [confirmingTripId, setConfirmingTripId] = useState<string | null>(null);
    const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH' | 'ALL'>('ALL');
    const [stats, setStats] = useState({ count: 0, totalWeight: 0, totalKm: 0, totalMoney: 0, newTripsCount: 0, creditTripsCount: 0 });
    const [showTour, setShowTour] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [filterCp, setFilterCp] = useState('');
    const [filterDriverId, setFilterDriverId] = useState('');
    const [filterClientId, setFilterClientId] = useState('');

    const [drivers, setDrivers] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [newTrip, setNewTrip] = useState<any>({
        choferId: '', unidadId: '', clientId: '', destinoNombre: '',
        destinoLat: -34.6037, destinoLng: -58.3816, mercaderiaTipo: '',
        volumen: '', pesoToneladas: 0
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedAddressLabel, setSelectedAddressLabel] = useState('Obelisco, Buenos Aires');

    const fetchMetadata = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const [driversRes, unitsRes, clientsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/management/drivers?tenantId=${tenantId || ''}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/units?tenantId=${tenantId || ''}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/management/clients?tenantId=${tenantId || ''}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setDrivers(driversRes.data);
            setUnits(unitsRes.data);
            setClients(clientsRes.data);
        } catch (err) { console.error(err); }
    };

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            let url = `${API_BASE_URL}/trips?tenantId=${tenantId || ''}`;
            if (filterDriverId) url += `&choferId=${filterDriverId}`;
            if (filterClientId) url += `&clientId=${filterClientId}`;
            if (filterCp) url += `&cp=${filterCp}`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

            // Forzar conversión numérica de peso al recibir los datos
            const enrichedTrips = res.data.map((t: any) => ({
                ...t,
                pesoToneladas: Number(t.peso_toneladas || t.pesoToneladas || 0)
            }));
            setTrips(enrichedTrips);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            let url = `${API_BASE_URL}/trips/stats?tenantId=${tenantId || ''}&period=${period}`;
            if (filterDriverId) url += `&choferId=${filterDriverId}`;
            if (filterClientId) url += `&clientId=${filterClientId}`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

            // RECALCULAR peso localmente si el servidor devuelve 0 (fallback)
            const localWeight = trips.reduce((acc, t) => acc + Number(t.pesoToneladas || 0), 0);

            setStats({
                ...res.data,
                totalWeight: res.data.totalWeight > 0 ? Number(res.data.totalWeight) : localWeight
            });
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchMetadata();
        fetchTrips();
    }, [tenantId, filterDriverId, filterClientId]);

    useEffect(() => {
        fetchStats();
    }, [trips, period]);

    const handleSearchAddress = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            // Cambio a /trips/geocode para evitar el 404
            const res = await axios.get(`${API_BASE_URL}/trips/geocode?q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
        } catch (err) {
            console.log('Internal geocode failed, trying fallback...', err);
            try {
                const fallbackRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ar`);
                setSearchResults(fallbackRes.data);
            } catch (fallbackErr) {
                notify('Error al buscar dirección. Intente ser más específico.', 'error');
            }
        } finally { setIsSearching(false); }
    };

    const selectLocation = (lat: string | number, lon: string | number, label: string) => {
        setNewTrip({ ...newTrip, destinoLat: Number(lat), destinoLng: Number(lon), destinoNombre: label });
        setSelectedAddressLabel(label);
        setSearchResults([]);
        setSearchQuery('');
    };

    const executeCreate = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

            const payload = {
                ...newTrip,
                tenantId: tenantId || newTrip.clientId,
                destinoLat: Number(newTrip.destinoLat),
                destinoLng: Number(newTrip.destinoLng),
                pesoToneladas: Number(newTrip.pesoToneladas || 0),
                adminNameBypass: currentUser.nombreCompleto || 'Administrador'
            };

            if (confirmingTripId) {
                // ACTUALIZAR VIAJE EXISTENTE (Solicitado -> Pendiente)
                await axios.patch(`${API_BASE_URL}/trips/${confirmingTripId}`, {
                    ...payload,
                    estado: 'PENDIENTE'
                }, { headers: { Authorization: `Bearer ${token}` } });
                notify('Viaje asignado con éxito', 'success');
            } else {
                // CREAR VIAJE NUEVO
                await axios.post(`${API_BASE_URL}/trips`, payload, { headers: { Authorization: `Bearer ${token}` } });
                notify('Viaje despachado con éxito', 'success');
            }

            setShowModal(false);
            setConfirmingTripId(null);
            setNewTrip({
                choferId: '', unidadId: '', clientId: '', destinoNombre: '',
                destinoLat: -34.6037, destinoLng: -58.3816, mercaderiaTipo: '',
                volumen: '', pesoToneladas: 0
            });
            fetchTrips();
        } catch (err: any) { notify(err.response?.data?.message || 'Error', 'error'); }
    };

    const handleCancel = async (id: string, motivo: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/trips/${id}/cancel`, { comentario: motivo }, { headers: { Authorization: `Bearer ${token}` } });
            notify('Viaje anulado', 'info');
            fetchTrips();
        } catch (err) { notify('Error', 'error'); }
    };

    const tourSteps = [
        { elementId: 'tour-viajes-titulo', title: 'Gestión de Viajes', content: 'Acá tenés el control total de los fletes. Podés despachar nuevos viajes y monitorear los actuales.', position: 'bottom' as const },
        { elementId: 'tour-btn-despachar', title: 'Despachar Viaje', content: 'Hacé clic acá para crear un nuevo viaje. Te va a pedir elegir un dador de carga, un chofer y el destino.', position: 'bottom' as const },
        { elementId: 'tour-viajes-stats', title: 'Resumen de Hoy', content: 'Estos números te muestran cuánto peso estás moviendo hoy y cuántos viajes están activos.', position: 'bottom' as const },
        { elementId: 'tour-viajes-tabla', title: 'Tu Hoja de Ruta', content: 'Esta tabla es el corazón de la logística. Cada fila representa un viaje real transportando carga.', position: 'top' as const },
        { elementId: 'tour-col-cp', title: 'Número de CP', content: 'La Carta de Porte es el DNI del viaje. Con este número podés rastrear cualquier papel o reclamo.', position: 'bottom' as const },
        { elementId: 'tour-col-cliente', title: 'Dador de Carga', content: 'Acá ves quién te contrató el flete. Es el cliente al que después le vas a cobrar.', position: 'bottom' as const },
        { elementId: 'tour-col-peso', title: 'Carga y Tonelaje', content: 'Detalle de qué se lleva y cuánto pesa. El sistema suma estos kilos para tus estadísticas.', position: 'bottom' as const },
        { elementId: 'tour-viajes-estados', title: 'Semáforo de Estados', content: 'PENDIENTE (Azul): El chofer aún no salió. EN CAMINO (Verde): El camión ya está en ruta con GPS activo. FINALIZADO: El viaje terminó con éxito.', position: 'left' as const },
        { elementId: 'tour-btn-seguimiento', title: 'Botón: Seguimiento', content: 'Hacé clic acá para abrir el mapa detallado y ver EXACTAMENTE dónde está el camión ahora mismo.', position: 'left' as const },
        { elementId: 'tour-btn-anular', title: 'Botón: Anular', content: 'Si el viaje se canceló o hubo un error al crearlo, usá este botón para sacarlo de la lista (te va a pedir un motivo).', position: 'left' as const }
    ];

    return (
        <div style={{ padding: 'clamp(1rem, 2vw, 2.5rem)', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <VisualHelpCard
                sectionId="viajes"
                title="Gestión de Viajes"
                onStartTour={() => setShowTour(true)}
                description="Acá es donde anotás y seguís los viajes de los camiones. Podés ver qué están llevando, por dónde van y si ya entregaron la carga."
                concepts={[
                    { term: "Estado", explanation: "Te dice qué está haciendo el camión ahora (si está viajando, si llegó o si ya terminó)." },
                    { term: "Carta de Porte (CP)", explanation: "Es el número del papel que identifica a cada viaje. Es único para cada uno." },
                    { term: "Despachar", explanation: "Es el acto de crear el viaje en el sistema y avisarle al chofer que tiene trabajo." }
                ]}
                steps={[
                    "Para empezar uno nuevo, usá el botón azul '+ Despachar Viaje'.",
                    "Elegí al chofer, su camión y decile a dónde tiene que ir.",
                    "Una vez que el viaje arranca, lo vas a ver en la lista de abajo.",
                    "Si querés ver el mapa y dónde está el camión, tocá 'Seguimiento de Viaje'."
                ]}
                tips={[
                    "Los colores te ayudan: Azul es 'Pendiente', Verde es que ya está 'En Camino'.",
                    "Si el sistema dice 'Geocerca Violada', no te asustes; solo significa que el chofer frenó o pasó por un lugar que no estaba marcado."
                ]}
            />
            <style>{`
                .glass-panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.05); }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 1100; display: flex; justify-content: center; align-items: flex-start; padding: 2rem 1rem; overflow-y: auto; }
                .btn-command-txt { display: flex; align-items: center; gap: 6px; padding: 0.45rem 0.9rem; border-radius: 10px; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 800; transition: all 0.2s; color: white; }
                .btn-command-txt:hover { transform: translateY(-2px); filter: brightness(1.2); }
                .form-tab-btn { flex: 1; padding: 1.25rem; background: none; border: none; color: white; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.05em; cursor: pointer; transition: all 0.3s; opacity: 0.4; border-bottom: 2px solid transparent; }
                .form-tab-btn.active { opacity: 1; color: #818cf8; border-bottom: 2px solid #818cf8; background: rgba(129, 140, 248, 0.05); }
                table { width: 100%; border-collapse: collapse; }
                th { padding: 1.25rem 1rem; text-align: left; font-size: 0.7rem; opacity: 0.5; text-transform: uppercase; font-weight: 800; }
                td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; }
                
                @media (max-width: 1024px) {
                    .trip-card { padding: 1rem !important; border-radius: 16px !important; }
                    .trip-card-header { margin-bottom: 0.75rem !important; }
                    .trip-card-info { font-size: 0.75rem !important; margin-bottom: 0.5rem !important; }
                    .trip-card-badges { padding: 0.4rem !important; border-radius: 10px !important; }
                }
            `}</style>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div id="tour-viajes-titulo" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '0.65rem', borderRadius: '14px', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}>
                        <Navigation size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Gestión de Viajes</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} opacity={0.5} />
                        <select value={period} onChange={e => setPeriod(e.target.value as any)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8rem', outline: 'none' }}>
                            <option value="ALL">Todo</option><option value="DAY">Hoy</option><option value="WEEK">Semana</option><option value="MONTH">Mes</option>
                        </select>
                    </div>
                    <button id="tour-btn-despachar" onClick={() => { setFormTab('logistica'); setShowModal(true); }} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                        <Plus size={18} /> Despachar Viaje
                    </button>
                </div>
            </div>

            <div id="tour-viajes-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                <div id="tour-stats-viajes-count" className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>VIAJES REALIZADOS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>
                        {stats.count}
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700, marginTop: '2px' }}>
                            ({stats.newTripsCount || 0} Nuevos + {stats.creditTripsCount || 0} Vales)
                        </div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #a855f7', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>TONELAJE ACUMULADO</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>
                        {Number(stats.totalWeight || 0).toFixed(1)} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Ton</span>
                        <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700, marginTop: '2px' }}>({(Number(stats.totalWeight || 0) * 1000).toLocaleString()} Kg)</div>
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #22c55e', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>DISTANCIA TOTAL</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>{stats.totalKm.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>KM</span></div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #fbbf24', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5 }}>MONTO OPERATIVO</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>${stats.totalMoney.toLocaleString()}</div>
                </div>
            </div>

            <div id="tour-viajes-filtros" className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} /><input type="text" placeholder="Buscador CP..." value={filterCp} onChange={e => setFilterCp(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }} /></div>
                <select value={filterDriverId} onChange={e => setFilterDriverId(e.target.value)} style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}><option value="">Choferes...</option>{drivers.map(d => <option key={d.id} value={d.id} style={{ background: '#1e293b' }}>{d.nombre}</option>)}</select>
                <select value={filterClientId} onChange={e => setFilterClientId(e.target.value)} style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}><option value="">Clientes...</option>{clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>{c.nombreRazonSocial}</option>)}</select>
            </div>

            {!isMobile ? (
                <div className="glass-panel" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <table>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}><th>N° CP</th><th>Cliente</th><th>Chofer / Unidad</th><th>Carga / Peso</th><th>Estado</th><th></th></tr></thead>
                        <tbody>
                            {trips.map((trip, i) => {
                                const style = getStatusStyle(trip.estado);
                                const peso = Number(trip.pesoToneladas || 0);
                                return (
                                    <tr key={trip.id}>
                                        <td id={i === 0 ? 'tour-col-cp' : ''} style={{ fontFamily: 'monospace', fontWeight: 900, color: '#3b82f6', cursor: trip.estado === 'SOLICITADO' ? 'pointer' : 'default' }} onClick={() => {
                                            if (trip.estado === 'SOLICITADO') {
                                                setNewTrip({
                                                    clientId: trip.client?.id || '',
                                                    destinoNombre: trip.destinoNombre || '',
                                                    destinoLat: trip.destinoLat || -34.6037,
                                                    destinoLng: trip.destinoLng || -58.3816,
                                                    mercaderiaTipo: trip.mercaderiaTipo || '',
                                                    pesoToneladas: trip.pesoToneladas || 0,
                                                    choferId: '',
                                                    unidadId: ''
                                                });
                                                setConfirmingTripId(trip.id);
                                                setSelectedAddressLabel(trip.destinoNombre || 'Zárate, Partido de Zárate');
                                                setFormTab('logistica');
                                                setShowModal(true);
                                            }
                                        }}>{trip.numeroCP}</td>
                                        <td id={i === 0 ? 'tour-col-cliente' : ''} style={{ fontWeight: 700 }}>{trip.client?.nombreRazonSocial}</td>
                                        <td><div style={{ fontWeight: 600 }}>{trip.chofer?.nombre}</div><div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{trip.unidad?.patente}</div></td>
                                        <td id={i === 0 ? 'tour-col-peso' : ''}><div>{trip.mercaderiaTipo || 'General'}</div><div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4ade80' }}>{peso.toFixed(1)} Ton ({(peso * 1000).toLocaleString()} Kg)</div></td>
                                        <td><span id={i === 0 ? 'tour-viajes-estados' : ''} style={{ padding: '0.25rem 0.5rem', background: style.bg, color: style.color, borderRadius: '6px', fontSize: '0.6rem', fontWeight: 800 }}>{style.label}</span></td>
                                        <td style={{ textAlign: 'right' }}><div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            {trip.estado === 'SOLICITADO' && (
                                                <button onClick={() => {
                                                    setNewTrip({
                                                        clientId: trip.client?.id || '',
                                                        destinoNombre: trip.destinoNombre || '',
                                                        destinoLat: trip.destinoLat || -34.6037,
                                                        destinoLng: trip.destinoLng || -58.3816,
                                                        mercaderiaTipo: trip.mercaderiaTipo || '',
                                                        pesoToneladas: trip.pesoToneladas || 0,
                                                        choferId: '',
                                                        unidadId: ''
                                                    });
                                                    setConfirmingTripId(trip.id); // Guardamos el ID del viaje a asignar
                                                    setSelectedAddressLabel(trip.destinoNombre || 'Zárate, Partido de Zárate');
                                                    setFormTab('logistica');
                                                    setShowModal(true);
                                                }} className="btn-command-txt" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                                    <User size={12} /> Asignar Chófer
                                                </button>
                                            )}
                                            {trip.estado !== 'SOLICITADO' && (
                                                <button id={i === 0 ? 'tour-btn-seguimiento' : ''} onClick={() => setSelectedTripId(trip.id)} className="btn-command-txt" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                                                    <MapIcon size={12} /> Seguimiento de Viaje
                                                </button>
                                            )}
                                            {trip.estado !== 'FINALIZADO' && trip.estado !== 'ANULADO' && (
                                                <button id={i === 0 ? 'tour-btn-anular' : ''} onClick={() => { const m = window.prompt('Motivo de anulación:'); if (m) handleCancel(trip.id, m); }} className="btn-command-txt" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                                                    <XCircle size={12} /> Anular
                                                </button>
                                            )}
                                        </div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {trips.map(trip => {
                        const style = getStatusStyle(trip.estado);
                        const peso = Number(trip.pesoToneladas || 0);
                        return (
                            <div key={trip.id} className="glass-panel trip-card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }} className="trip-card-header">
                                    <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#3b82f6', fontSize: '0.95rem' }}>{trip.numeroCP}</div>
                                    <span style={{ padding: '0.25rem 0.5rem', background: style.bg, color: style.color, borderRadius: '8px', fontSize: '0.6rem', fontWeight: 800 }}>{style.label}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>{trip.client?.nombreRazonSocial}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.75rem' }} className="trip-card-info">{trip.chofer?.nombre} • {trip.unidad?.patente}</div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="trip-card-badges">
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{trip.mercaderiaTipo || 'General'}</div>
                                    <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '0.75rem' }}>{peso.toFixed(1)} Ton ({(peso * 1000).toLocaleString()} Kg)</div>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setSelectedTripId(trip.id)} className="btn-command-txt" style={{ flex: 1, justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}><MapIcon size={14} /> Seguimiento</button>
                                    <button onClick={() => { const m = window.prompt('Motivo:'); if (m) handleCancel(trip.id, m); }} className="btn-command-txt" style={{ justifyContent: 'center', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}><XCircle size={14} /> Anular</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL DESPACHO PREMIUM (IDENTICO A CHOFERES) */}
            {showModal && (
                <div className="modal-overlay">
                    <style>{`
                            .modal-header-responsive { padding: 2.5rem 3rem; }
                            .modal-body-responsive { padding: 3.5rem; }
                            .modal-grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2.5rem; }
                            @media (max-width: 768px) {
                                .modal-header-responsive { padding: 1.5rem !important; }
                                .modal-body-responsive { padding: 1.5rem !important; }
                                .modal-grid-2 { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
                                .modal-header-logo { width: 48px !important; height: 48px !important; }
                                .modal-header-logo svg { width: 20px !important; height: 20px !important; }
                                .modal-header-title { fontSize: 1.25rem !important; }
                                .form-tab-btn { padding: 1rem !important; font-size: 0.65rem !important; }
                            }
                        `}</style>
                    <div className="modal-header-responsive" style={{ background: 'rgba(30, 41, 59, 0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div className="modal-header-logo" style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.5)' }}>
                                <Navigation size={32} color="white" />
                            </div>
                            <div>
                                <h2 className="modal-header-title" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Despacho</h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '0.2rem' }}>Inicie un nuevo seguimiento logístico.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                            <X size={22} />
                        </button>
                    </div>

                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', width: formTab === 'logistica' ? '50%' : '100%', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.01)' }}>
                        <button type="button" onClick={() => setFormTab('logistica')} className={`form-tab-btn ${formTab === 'logistica' ? 'active' : ''}`}>
                            <span style={{ marginRight: '8px', opacity: 0.5 }}>01</span> LOGÍSTICA
                        </button>
                        <button type="button" onClick={() => setFormTab('carga')} className={`form-tab-btn ${formTab === 'carga' ? 'active' : ''}`}>
                            <span style={{ marginRight: '8px', opacity: 0.5 }}>02</span> CARGA Y DESTINO
                        </button>
                    </div>

                    <div className="modal-body-responsive">
                        {formTab === 'logistica' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <Layers size={14} color="#3b82f6" /> Dador de Carga
                                    </label>
                                    <select value={newTrip.clientId} onChange={e => setNewTrip({ ...newTrip, clientId: e.target.value })} style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '18px', outline: 'none', fontSize: '1rem' }}>
                                        <option value="" style={{ background: '#1e293b' }}>Seleccionar...</option>
                                        {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>{c.nombreRazonSocial}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <User size={14} color="#3b82f6" /> Chofer Asignado
                                    </label>
                                    <select value={newTrip.choferId} onChange={e => setNewTrip({ ...newTrip, choferId: e.target.value })} style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '18px', outline: 'none', fontSize: '1rem' }}>
                                        <option value="" style={{ background: '#1e293b' }}>Seleccionar...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id} style={{ background: '#1e293b' }}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <Gauge size={14} color="#3b82f6" /> Unidad
                                    </label>
                                    <select value={newTrip.unidadId} onChange={e => setNewTrip({ ...newTrip, unidadId: e.target.value })} style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '18px', outline: 'none', fontSize: '1rem' }}>
                                        <option value="" style={{ background: '#1e293b' }}>Seleccionar...</option>
                                        {units.map(u => <option key={u.id} value={u.id} style={{ background: '#1e293b' }}>{u.patente} ({u.marca})</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            <Package size={14} color="#3b82f6" /> Mercadería
                                        </label>
                                        <input type="text" placeholder="Ej: Contenedor" value={newTrip.mercaderiaTipo} onChange={e => setNewTrip({ ...newTrip, mercaderiaTipo: e.target.value })} style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '18px', outline: 'none', fontSize: '1rem' }} />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            <Weight size={14} /> Peso (Ton)
                                        </label>
                                        <input type="number" placeholder="0.00" value={newTrip.pesoToneladas || ''} onChange={e => setNewTrip({ ...newTrip, pesoToneladas: Number(e.target.value) })} style={{ width: '100%', padding: '1.2rem', background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '18px', outline: 'none', fontWeight: '900', fontSize: '1.1rem', textAlign: 'center' }} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <MapPin size={14} color="#3b82f6" /> Destino
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="text" placeholder="Ciudad o Planta..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '18px', outline: 'none', fontSize: '1rem' }} />
                                        <button onClick={handleSearchAddress} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '18px', padding: '0 1.5rem', color: 'white', cursor: 'pointer' }}>
                                            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                        </button>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div style={{ background: '#1e293b', borderRadius: '14px', marginTop: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                                            {searchResults.map(r => (
                                                <button
                                                    key={r.place_id}
                                                    onClick={() => selectLocation(r.lat, r.lon, r.display_name)}
                                                    style={{ width: '100%', textAlign: 'left', padding: '1rem', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    {r.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>📍 {selectedAddressLabel}</div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '1.1rem 2.5rem', borderRadius: '16px', fontWeight: 700 }}>CANCELAR</button>
                                {formTab === 'logistica' ? (
                                    <button type="button" onClick={() => setFormTab('carga')} className="btn-primary" style={{ padding: '1.1rem 3.5rem', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                                        SIGUIENTE <ArrowRight size={20} />
                                    </button>
                                ) : (
                                    <button onClick={executeCreate} className="btn-primary" style={{ padding: '1.1rem 4rem', borderRadius: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', background: confirmingTripId ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', boxShadow: confirmingTripId ? '0 10px 20px -5px rgba(59, 130, 246, 0.4)' : '0 10px 20px -5px rgba(34, 197, 94, 0.4)' }}>
                                        <Save size={20} /> {confirmingTripId ? 'CONFIRMAR ASIGNACIÓN' : 'DESPACHAR VIAJE'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedTripId && (
                <LogViaje tripId={selectedTripId} onClose={() => setSelectedTripId(null)} />
            )}

            {showTour && (
                <VisualTourOverlay
                    steps={tourSteps}
                    onClose={() => setShowTour(false)}
                />
            )}
        </div>
    );
}
