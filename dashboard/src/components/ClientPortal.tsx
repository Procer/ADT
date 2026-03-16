import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, FileText, Activity, Box, ShieldCheck, Navigation, XCircle, CheckCircle, Filter, Search, Calendar, Anchor, RefreshCw, PlusCircle, Upload, Download, Loader2, Package, Layers } from 'lucide-react';
import axios from 'axios';
import MapModal from './MapModal';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ClientPortalProps {
    clientId: string;
}

type FilterStatus = 'TODOS' | 'SOLICITADOS' | 'ACTIVOS' | 'FINALIZADOS' | 'ANULADOS';
type TabType = 'TRACKING' | 'REQUEST';

export default function ClientPortal({ clientId }: ClientPortalProps) {
    const [allTrips, setAllTrips] = useState<any[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('TRACKING');

    // Estado Formulario Carga
    const [formData, setFormData] = useState({
        origenNombre: '',
        destinoNombre: '',
        destinoLat: '',
        destinoLng: '',
        mercaderiaTipo: '',
        volumen: '',
        pesoToneladas: 0,
        referenciaCliente: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados para búsqueda de dirección
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedAddressLabel, setSelectedAddressLabel] = useState('');

    // Fetch inicial y polling cada 30 segundos
    useEffect(() => {
        fetchTrips();
        const interval = setInterval(fetchTrips, 30000);
        return () => clearInterval(interval);
    }, [clientId]);

    useEffect(() => {
        let filtered = [...allTrips];
        
        if (statusFilter === 'ACTIVOS') {
            filtered = filtered.filter(t => 
                t.estado === 'PENDIENTE' || 
                t.estado === 'EN_CAMINO' || 
                t.estado === 'LLEGUE' || 
                t.estado === 'CARGA_DESCARGA'
            );
        } else if (statusFilter === 'SOLICITADOS') {
            filtered = filtered.filter(t => t.estado === 'SOLICITADO');
        } else if (statusFilter === 'FINALIZADOS') {
            filtered = filtered.filter(t => t.estado === 'FINALIZADO');
        } else if (statusFilter === 'ANULADOS') {
            filtered = filtered.filter(t => t.estado === 'ANULADO');
        }

        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.numeroCP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.unidad?.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.destinoNombre?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredTrips(filtered);
        
        if (selectedTrip) {
            const updated = allTrips.find((t: any) => t.id === selectedTrip.id);
            if (updated) setSelectedTrip(updated);
        }
    }, [allTrips, statusFilter, searchTerm]);

    const handleSearchAddress = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ar`);
            setSearchResults(res.data);
        } catch (err) {
            console.error('Geocoding error', err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (lat: string | number, lon: string | number, label: string) => {
        setFormData({ ...formData, destinoLat: String(lat), destinoLng: String(lon), destinoNombre: label });
        setSelectedAddressLabel(label);
        setSearchResults([]);
        setSearchQuery('');
    };

    const fetchTrips = async () => {
        try {
            if (!clientId) return;
            const res = await axios.get(`${API_BASE_URL}/client-portal/trips?clientId=${clientId}`);
            setAllTrips(res.data);
        } catch (err) {
            console.error('Error fetching client trips', err);
        } finally {
            setLoading(false);
        }
    };

    const updateTracking = async (tripId: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/client-portal/trips/${tripId}/tracking?clientId=${clientId}`);
            setTrackingData(res.data);
        } catch (err) {
            console.error('Error updating tracking data', err);
        }
    };

    const selectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setTrackingData(null);
        if (trip.estado !== 'ANULADO' && trip.estado !== 'FINALIZADO' && trip.estado !== 'SOLICITADO') {
            updateTracking(trip.id);
        }
    };

    const handleFormSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/client-portal/trips?clientId=${clientId}`, formData);
            setFormData({ origenNombre: '', destinoNombre: '', destinoLat: '', destinoLng: '', referenciaCliente: '' });
            await fetchTrips();
            setActiveTab('TRACKING');
        } catch (err) {
            console.error('Error creating trip', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`${API_BASE_URL}/client-portal/trips/upload?clientId=${clientId}`, formData);
            await fetchTrips();
            setActiveTab('TRACKING');
        } catch (err) {
            console.error('Error uploading trips', err);
        } finally {
            setSubmitting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        window.open(`${API_BASE_URL}/client-portal/template`);
    };

    if (loading && allTrips.length === 0) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1.5rem' }}>
            <div className="animate-spin" style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
            <p style={{ fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em' }}>SINCRONIZANDO PORTAL DE TRANSPARENCIA...</p>
        </div>
    );

    // Lógica avanzada de ETA: Devuelve hora de llegada y tiempo restante
    const getEtaDetails = (minutes: number | null | undefined, estado: string) => {
        if (estado === 'SOLICITADO') return { main: 'EN ESPERA', sub: 'Pendiente de aprobación' };
        if (estado === 'ANULADO') return { main: 'CANCELADO', sub: 'Viaje interrumpido' };
        
        if (estado === 'FINALIZADO') {
            const date = selectedTrip?.tsFinalizacionReal || selectedTrip?.tsCierre;
            return { 
                main: date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs' : 'FINALIZADO',
                sub: 'Entrega completada'
            };
        }

        if (estado === 'LLEGUE' || estado === 'CARGA_DESCARGA') return { main: 'EN DESTINO', sub: 'Operaciones en planta' };
        
        if (estado === 'PENDIENTE') return { main: 'A PROGRAMAR', sub: 'Esperando salida' };

        if (minutes === null || minutes === undefined || minutes <= 0) return { main: 'CALCULANDO', sub: 'Analizando trayectoria GPS...' };

        // Cálculo de Hora de Arribo: Hora Actual + Minutos restantes
        const arrivalTime = new Date(Date.now() + minutes * 60000);
        const mainStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs';
        
        let subStr = '';
        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            subStr = `Llega en ${hours}h ${mins}m`;
        } else {
            subStr = `Llega en ${minutes} min`;
        }

        return { main: mainStr, sub: subStr };
    };

    const getStatusStyle = (estado: string) => {
        switch (estado) {
            case 'EN_CAMINO': return { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', label: 'EN TRÁNSITO', icon: <Navigation size={14} /> };
            case 'LLEGUE': return { bg: 'rgba(99,102,241,0.1)', text: 'var(--accent-blue)', label: 'EN DESTINO', icon: <MapPin size={14} /> };
            case 'CARGA_DESCARGA': return { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', label: 'OPERANDO', icon: <Anchor size={14} /> };
            case 'FINALIZADO': return { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.6)', label: 'FINALIZADO', icon: <CheckCircle size={14} /> };
            case 'ANULADO': return { bg: 'rgba(239,68,68,0.1)', text: '#f87171', label: 'ANULADO', icon: <XCircle size={14} /> };
            case 'SOLICITADO': return { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', label: 'SOLICITADO', icon: <PlusCircle size={14} /> };
            default: return { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', label: 'PENDIENTE', icon: <Clock size={14} /> };
        }
    };

    const eta = getEtaDetails(trackingData?.smartEtaMinutes, selectedTrip?.estado);

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', overflowX: 'hidden' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Box size={32} color="var(--accent-blue)" />
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Portal de <span style={{ color: 'var(--accent-blue)' }}>Seguimiento</span></h1>
                    </div>
                    <p style={{ opacity: 0.5, fontSize: '1.1rem', fontWeight: 500 }}>Historial completo y monitoreo inteligente de activos.</p>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <button 
                            onClick={() => setActiveTab('TRACKING')} 
                            style={{ background: 'none', border: 'none', color: activeTab === 'TRACKING' ? 'var(--accent-blue)' : 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', opacity: activeTab === 'TRACKING' ? 1 : 0.4, borderBottom: activeTab === 'TRACKING' ? '2px solid var(--accent-blue)' : 'none', paddingBottom: '0.5rem' }}
                        >
                            SEGUIMIENTO EN VIVO
                        </button>
                        <button 
                            onClick={() => setActiveTab('REQUEST')} 
                            style={{ background: 'none', border: 'none', color: activeTab === 'REQUEST' ? 'var(--accent-blue)' : 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', opacity: activeTab === 'REQUEST' ? 1 : 0.4, borderBottom: activeTab === 'REQUEST' ? '2px solid var(--accent-blue)' : 'none', paddingBottom: '0.5rem' }}
                        >
                            SOLICITAR CARGA
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => fetchTrips()} 
                        className="glass-panel" 
                        style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Calendar size={18} opacity={0.5} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>HOY: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2.5rem' }}>
                <aside style={{ width: '100%', overflow: 'hidden' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <Search size={18} opacity={0.4} />
                            <input 
                                type="text" 
                                placeholder="Buscar por CP o Patente..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {(['TODOS', 'SOLICITADOS', 'ACTIVOS', 'FINALIZADOS', 'ANULADOS'] as FilterStatus[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    style={{ 
                                        padding: '0.4rem 0.8rem', 
                                        borderRadius: '8px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 800, 
                                        border: '1px solid var(--glass-border)',
                                        background: statusFilter === f ? 'var(--accent-blue)' : 'rgba(255,255,255,0.02)',
                                        color: statusFilter === f ? 'white' : 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Filter size={18} opacity={0.5} />
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Resultados ({filteredTrips.length})</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem', width: '100%' }} className="custom-scrollbar">
                        {filteredTrips.map(trip => {
                            const style = getStatusStyle(trip.estado);
                            return (
                                <div
                                    key={trip.id}
                                    onClick={() => selectTrip(trip)}
                                    className="glass-panel"
                                    style={{ 
                                        padding: '1.25rem', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: selectedTrip?.id === trip.id ? '2px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.05)',
                                        background: selectedTrip?.id === trip.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                                        transform: selectedTrip?.id === trip.id ? 'translateX(8px)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        width: '100%'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--accent-blue)', background: 'rgba(99,102,241,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                            CP: {trip.numeroCP || 'N/A'}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.6rem', 
                                            fontWeight: 900, 
                                            padding: '0.2rem 0.5rem', 
                                            borderRadius: '6px',
                                            background: style.bg,
                                            color: style.text,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            {style.icon} {style.label}
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {trip.unidad?.patente || 'SIN UNIDAD'}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4, fontSize: '0.75rem' }}>
                                        <MapPin size={12} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {trip.destinoNombre || 'Destino no especificado'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <main style={{ overflow: 'hidden' }}>
                    {activeTab === 'REQUEST' ? (
                        <div className="glass-panel" style={{ padding: '3rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Solicitar Nueva Carga</h2>
                                    <p style={{ opacity: 0.6, fontWeight: 500 }}>Complete los datos del envío para la aprobación del operador logístico.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        onClick={downloadTemplate}
                                        className="glass-panel" 
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'white' }}
                                    >
                                        <Download size={18} />
                                        DESCARGAR PLANTILLA
                                    </button>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--accent-blue)', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Upload size={18} />
                                        CARGA MASIVA (EXCEL)
                                    </button>
                                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={handleFileUpload} />
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Punto de Origen</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Nombre de la planta o depósito..."
                                            value={formData.origenNombre} 
                                            onChange={e => setFormData({...formData, origenNombre: e.target.value})}
                                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Nombre del Destino</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Empresa, Puerto o Localidad..."
                                            value={formData.destinoNombre} 
                                            onChange={e => setFormData({...formData, destinoNombre: e.target.value})}
                                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Tipo de Mercadería</label>
                                            <div style={{ position: 'relative' }}>
                                                <Package size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Ej: Insumos"
                                                    value={formData.mercaderiaTipo} 
                                                    onChange={e => setFormData({...formData, mercaderiaTipo: e.target.value})}
                                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Volumen / Carga</label>
                                            <div style={{ position: 'relative' }}>
                                                <Layers size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Ej: 20 pallets"
                                                    value={formData.volumen} 
                                                    onChange={e => setFormData({...formData, volumen: e.target.value})}
                                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Peso Total (Toneladas)</label>
                                            <div style={{ position: 'relative' }}>
                                                <Package size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="Ej: 28.5"
                                                    value={formData.pesoToneladas} 
                                                    onChange={e => setFormData({...formData, pesoToneladas: Number(e.target.value)})}
                                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Referencia de Carga (Opcional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Orden de Compra #12345"
                                            value={formData.referenciaCliente} 
                                            onChange={e => setFormData({...formData, referenciaCliente: e.target.value})}
                                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Dirección de Destino</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Ej: Calle 123, Zárate, Buenos Aires..." 
                                                    value={searchQuery} 
                                                    onChange={e => setSearchQuery(e.target.value)} 
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())} 
                                                    style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} 
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={handleSearchAddress} 
                                                disabled={isSearching} 
                                                style={{ padding: '0 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}
                                            >
                                                {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'BUSCAR'}
                                            </button>
                                        </div>
                                        
                                        {searchResults.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem', zIndex: 1100, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                                {searchResults.map(res => (
                                                    <button 
                                                        key={res.place_id} 
                                                        type="button" 
                                                        onClick={() => selectLocation(res.lat, res.lon, res.display_name)} 
                                                        style={{ width: '100%', textAlign: 'left', padding: '1rem', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                                    >
                                                        <MapPin size={16} opacity={0.5} /> {res.display_name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {selectedAddressLabel && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>
                                                <CheckCircle size={14} /> UBICACIÓN SELECCIONADA: {selectedAddressLabel}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1.5rem', borderRadius: '15px' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
                                            <ShieldCheck size={24} />
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Validación de Coordenadas</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0, lineHeight: 1.5 }}>
                                            Es fundamental ingresar coordenadas precisas para que el sistema pueda calcular el ETA y las alertas de geocerca correctamente una vez que el viaje sea asignado.
                                        </p>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        style={{ marginTop: 'auto', width: '100%', padding: '1.25rem', borderRadius: '15px', background: 'var(--accent-blue)', color: 'white', border: 'none', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                        {submitting ? 'PROCESANDO...' : 'CONFIRMAR SOLICITUD DE CARGA'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedTrip ? (
                        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>Detalle del Envío</h2>
                                        <div style={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: 900, 
                                            padding: '0.4rem 1rem', 
                                            borderRadius: '20px',
                                            background: getStatusStyle(selectedTrip.estado).bg,
                                            color: getStatusStyle(selectedTrip.estado).text,
                                            border: `1px solid ${getStatusStyle(selectedTrip.estado).text}44`
                                        }}>
                                            {getStatusStyle(selectedTrip.estado).label}
                                        </div>
                                    </div>
                                    <p style={{ opacity: 0.5, fontWeight: 600 }}>
                                        {selectedTrip.estado === 'SOLICITADO' ? 'Esperando aprobación y asignación de chofer/unidad' : `Operado por ${selectedTrip.chofer?.nombre || 'N/A'}`}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {trackingData?.lastLocation && (
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTrip.destinoLat},${selectedTrip.destinoLng}&origin=${trackingData.lastLocation.latitud},${trackingData.lastLocation.longitud}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="glass-panel"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.75rem', 
                                                padding: '0.75rem 1.5rem', 
                                                borderRadius: '12px', 
                                                background: 'rgba(59,130,246,0.1)', 
                                                border: '1px solid rgba(59,130,246,0.3)',
                                                color: '#60a5fa',
                                                textDecoration: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Navigation size={18} />
                                            GOOGLE MAPS
                                        </a>
                                    )}
                                    {selectedTrip.urlFotoRemito && (
                                        <a
                                            href={selectedTrip.urlFotoRemito}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#22c55e', border: 'none' }}
                                        >
                                            <FileText size={18} />
                                            DOCUMENTACIÓN
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <div className="glass-panel" style={{ 
                                    padding: '2rem', 
                                    borderRadius: '24px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '1.5rem', 
                                    background: selectedTrip.estado === 'FINALIZADO' 
                                        ? 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 100%)' 
                                        : 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 100%)' 
                                }}>
                                    <div style={{ 
                                        width: '64px', 
                                        height: '64px', 
                                        background: selectedTrip.estado === 'FINALIZADO' ? 'rgba(59,130,246,0.2)' : 'rgba(99,102,241,0.2)', 
                                        borderRadius: '18px', 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center', 
                                        color: selectedTrip.estado === 'FINALIZADO' ? '#60a5fa' : 'var(--accent-blue)' 
                                    }}>
                                        {selectedTrip.estado === 'FINALIZADO' ? <CheckCircle size={32} /> : <Clock size={32} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            {selectedTrip.estado === 'FINALIZADO' ? 'Arribo Confirmado' : 'Hora de Llegada (ETA)'}
                                        </div>
                                        <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1 }}>
                                            {eta.main}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.5, marginTop: '0.2rem' }}>
                                            {eta.sub}
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '2rem', opacity: 0.6 }}>LÍNEA DE TIEMPO DEL EVENTO</h3>
                                <div style={{ position: 'relative', paddingLeft: '3rem' }}>
                                    <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />
                                    
                                    {selectedTrip.estado === 'SOLICITADO' && (
                                        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 15px #60a5fa' }} />
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Solicitud Enviada</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>Registrado el: {new Date(selectedTrip.tsCreacion).toLocaleString()}</div>
                                        </div>
                                    )}

                                    <div style={{ position: 'relative', marginBottom: '2.5rem', opacity: selectedTrip.estado === 'SOLICITADO' ? 0.3 : 1 }}>
                                        <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 15px var(--accent-blue)' }} />
                                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Salida de Origen</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(selectedTrip.tsCreacion).toLocaleString()}</div>
                                    </div>

                                    {(selectedTrip.tsInicioReal || selectedTrip.tsInicio) && (
                                        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 15px #4ade80' }} />
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Viaje Iniciado</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(selectedTrip.tsInicioReal || selectedTrip.tsInicio).toLocaleString()}</div>
                                        </div>
                                    )}

                                    {selectedTrip.estado === 'FINALIZADO' && (
                                        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 15px #60a5fa' }} />
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Entregado / Finalizado</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(selectedTrip.tsFinalizacionReal || selectedTrip.tsCierre).toLocaleString()}</div>
                                        </div>
                                    )}

                                    {selectedTrip.estado === 'ANULADO' && (
                                        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
                                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', boxShadow: '0 0 15px #f87171' }} />
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Viaje Anulado</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>Cancelado el: {new Date(selectedTrip.tsCierre).toLocaleString()}</div>
                                        </div>
                                    )}

                                    {(selectedTrip.estado === 'PENDIENTE' || selectedTrip.estado === 'EN_CAMINO' || selectedTrip.estado === 'LLEGUE' || selectedTrip.estado === 'CARGA_DESCARGA') && (
                                        <div style={{ position: 'relative', opacity: 0.3 }}>
                                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />
                                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Arribo a Destino</div>
                                            <div style={{ fontSize: '0.75rem' }}>Proyectado: {eta.main}</div>
                                        </div>
                                    )}
                                </div>

                            {selectedTrip.estado !== 'ANULADO' && selectedTrip.estado !== 'FINALIZADO' && (
                                <div style={{ 
                                    padding: '1.5rem', 
                                    background: 'rgba(245,158,11,0.05)', 
                                    borderRadius: '20px', 
                                    border: '1px solid rgba(245,158,11,0.2)', 
                                    display: 'flex', 
                                    gap: '1.25rem', 
                                    alignItems: 'center' 
                                }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fbbf24' }}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.15rem' }}>PROTOCOLO DE SEGURIDAD ACTIVO</div>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0, lineHeight: 1.4 }}>
                                            La ubicación GPS mostrada tiene un retraso de seguridad de 120 segundos para protección de activos y personal en tránsito.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ height: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem', opacity: 0.5, borderRadius: '30px', borderStyle: 'dashed' }}>
                            <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
                                <Activity size={60} opacity={0.2} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Historial y Seguimiento</h3>
                            <p style={{ maxWidth: '400px', lineHeight: 1.6 }}>Utilice los filtros laterales para buscar viajes específicos o seleccione uno de la lista para ver su detalle completo.</p>
                        </div>
                    )}
                </main>
            </div>

            {showMap && trackingData?.lastLocation && (
                <MapModal 
                    lat={trackingData.lastLocation.latitud} 
                    lng={trackingData.lastLocation.longitud} 
                    title={`Seguimiento en Vivo - ${selectedTrip.unidad.patente}`} 
                    onClose={() => setShowMap(false)} 
                />
            )}
        </div>
    );
}
