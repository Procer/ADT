import { API_BASE_URL } from '../config';
import { CreditCard, Calendar, Search, Building } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import VisualHelpCard from './common/VisualHelpCard';
import VisualTourOverlay from './common/VisualTourOverlay';



export default function AuditoriaCreditos({ tenantId }: { tenantId: string | null }) {
    const [credits, setCredits] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        clientId: '',
        startDate: '',
        endDate: ''
    });

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');

            // Fetch clients for the filter
            const clientsRes = await axios.get(`${API_BASE_URL}/management/clients?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);

            // Fetch billing audit data
            const res = await axios.get(`${API_BASE_URL}/management/billing-audit?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Map and filter data
            if (res.data && Array.isArray(res.data.detalles)) {
                setCredits(res.data.detalles);
            } else {
                setCredits([]);
            }
        } catch (err) {
            console.error('Error fetching credits audit', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);

    const filteredCredits = credits.filter(c => {
        const matchesClient = !filters.clientId || c.dadorCargaId === filters.clientId;
        const matchesDate = (!filters.startDate || new Date(c.fecha) >= new Date(filters.startDate)) &&
            (!filters.endDate || new Date(c.fecha) <= new Date(filters.endDate));
        return matchesClient && matchesDate;
    });

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
            <VisualHelpCard
                sectionId="creditos"
                title="Auditoría de Créditos"
                onStartTour={() => setShowTour(true)}
                description="Acá podés ver cómo se usaron tus Cartas de Porte. El sistema ADT cuida tu dinero: si un viaje se anula, se te devuelve el valor para que lo uses en otro momento."
                concepts={[
                    { term: "Crédito por Anulación", explanation: "Es un viaje que habías consumido pero se anuló. El sistema te guarda ese saldo para que lo uses en otro viaje." },
                    { term: "Upcharge (Ajuste)", explanation: "Es la diferencia de precio si la Carta de Porte aumentó desde que anulaste el viaje original. Pagás solo lo que falta." },
                    { term: "Consumo de CP", explanation: "Es un viaje nuevo que se descuenta de tu saldo actual." }
                ]}
                steps={[
                    "Filtrá por cliente para ver sus movimientos.",
                    "Revisá la columna 'Tipo' para ver qué se usó en cada viaje.",
                    "Si ves un monto bajo en un viaje, probablemente es porque solo se cobró el 'Ajuste' y el resto se cubrió con un Vale."
                ]}
                tips={[
                    "¡Es como una tarjeta de regalo! Si no la usás hoy, la usás mañana.",
                    "El sistema hace las cuentas difíciles por vos para que no pierdas por la inflación."
                ]}
            />
            <style>{`
                @media (max-width: 768px) {
                    .audit-header { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
                    .filters-container { flex-direction: column; align-items: stretch !important; gap: 1rem !important; }
                    .filter-item { width: 100% !important; flex: none !important; }
                    .table-container { margin: 0 -1rem; border-radius: 0 !important; }
                }
            `}</style>

            <div className="audit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <CreditCard size={isMobile ? 24 : 32} color="var(--accent-blue)" />
                    <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800 }}>Auditoría de Créditos y Upcharges</h1>
                </div>
                <button onClick={fetchData} className="btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <Search size={16} /> Refrescar
                </button>
            </div>

            {/* Filtros */}
            <div id="tour-audit-filters" className="glass-panel filters-container" style={{ padding: isMobile ? '1rem' : '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="filter-item" style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: 700 }}>
                        <Building size={14} /> DADOR DE CARGA
                    </label>
                    <select
                        value={filters.clientId}
                        onChange={e => setFilters({ ...filters, clientId: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                        <option value="" style={{ color: '#0f172a' }}>Todos los dadores</option>
                        {clients.map((c: any) => (
                            <option key={c.id} value={c.id} style={{ color: '#0f172a' }}>
                                {c.nombreRazonSocial}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-item">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: 700 }}>
                        <Calendar size={14} /> DESDE
                    </label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                </div>
                <div className="filter-item">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', fontWeight: 700 }}>
                        <Calendar size={14} /> HASTA
                    </label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--accent-blue)', fontWeight: 700 }}>Analizando transacciones...</div>
            ) : (
                <div id="tour-audit-table" className="glass-panel table-container" style={{ overflowX: 'auto', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05rem', opacity: 0.6 }}>
                                <th style={{ padding: '1.25rem' }}>Fecha</th>
                                <th style={{ padding: '1.25rem' }}>Dador de Carga</th>
                                <th style={{ padding: '1.25rem' }}>CP / Viaje</th>
                                <th style={{ padding: '1.25rem' }}>Tipo</th>
                                <th style={{ padding: '1.25rem' }}>Costo / Upcharge</th>
                                <th style={{ padding: '1.25rem' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCredits.length > 0 ? (
                                filteredCredits.map((c: any) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1rem 1.25rem' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{c.dadorCarga}</td>
                                        <td style={{ padding: '1rem 1.25rem', color: 'var(--accent-blue)', fontWeight: 800 }}>{c.numeroCP}</td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '12px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                background: c.tipo.includes('CRÉDITO') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: c.tipo.includes('CRÉDITO') ? '#22c55e' : 'var(--accent-blue)'
                                            }}>
                                                {c.tipo}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem', fontWeight: 900 }}>
                                            ${Number(c.costo).toLocaleString('es-AR')}
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                opacity: 0.8,
                                                padding: '0.2rem 0.5rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '4px'
                                            }}>
                                                {c.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>No hay movimientos que coincidan con los filtros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {showTour && (
                <VisualTourOverlay
                    onClose={() => setShowTour(false)}
                    steps={[
                        {
                            elementId: 'tour-audit-filters',
                            title: 'Buscador Inteligente',
                            content: 'Aquí puedes filtrar por cliente o por fecha para encontrar un movimiento específico.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-audit-table',
                            title: 'Entendiendo los Datos',
                            content: 'Aquí explicamos los campos: \n• Fecha: Cuándo ocurrió el movimiento. \n• Tipo: Si fue un Consumo Nuevo o si usaste un Crédito (Vale). \n• Costo/Upcharge: Lo que se te cobró finalmente.',
                            position: 'right'
                        }
                    ]}
                />
            )}
        </div>
    );
}
