import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VisualHelpCard from './common/VisualHelpCard';
import {
    CheckSquare, Square, FileText, RefreshCw,
    Search, Clock, AlertCircle, TrendingUp,
    ChevronDown, ChevronRight, Download, CheckCircle2
} from 'lucide-react';
import VisualTourOverlay from './common/VisualTourOverlay';



interface ClientGroup {
    clientName: string;
    trips: any[];
    totalRevenue: number;
    totalWeight: number;
}

export default function Finance360ToCollect({ tenantId }: { tenantId: string | null }) {
    const [trips, setTrips] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [lotes, setLotes] = useState<any[]>([]);
    const [kpis, setKpis] = useState({
        totalPendingProforma: 0,
        totalAwaitingPayment: 0,
        criticalTripsCount: 0,
        monthlyCollected: 0
    });
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
    const [expandedLotes, setExpandedLotes] = useState<Record<string, boolean>>({});
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [resTrips, resClients, resHistory, resKPIs] = await Promise.all([
                axios.get(`${API_BASE_URL}/management/trips?tenantId=${tenantId}`, { headers }),
                axios.get(`${API_BASE_URL}/management/clients?tenantId=${tenantId}`, { headers }),
                axios.get(`${API_BASE_URL}/finance-v3/lotes-dador?tenantId=${tenantId}`, { headers }),
                axios.get(`${API_BASE_URL}/finance-v3/collect-kpis?tenantId=${tenantId}`, { headers })
            ]);

            setTrips(resTrips.data.filter((t: any) =>
                (t.estado === 'ENTREGADO' || t.estado === 'FINALIZADO' || t.estado === 'LLEGUE') && !t.financialLotId
            ));
            setClients(resClients.data);
            setLotes(resHistory.data);
            setKpis(resKPIs.data);
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);

    const toggleClientExpand = (clientId: string) => {
        setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
    };

    const toggleLoteExpand = (loteId: string) => {
        setExpandedLotes(prev => ({ ...prev, [loteId]: !prev[loteId] }));
    };

    const getTripAgeColor = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days > 7) return '#ef4444'; // Rojo (Crítico)
        if (days > 3) return '#f59e0b'; // Amarillo (Advertencia)
        return '#22c55e'; // Verde (Normal)
    };

    // Agrupación de viajes por cliente
    const groupedTrips = trips.reduce((acc, trip) => {
        const clientId = trip.clientId || 'unknown';
        if (!acc[clientId]) {
            acc[clientId] = {
                clientName: trip.client?.nombreRazonSocial || 'Dador Desconocido',
                trips: [],
                totalRevenue: 0,
                totalWeight: 0
            };
        }
        acc[clientId].trips.push(trip);
        // Priorizar revenueAtExecution
        const revenue = Number(trip.revenueAtExecution || trip.precioCongelado || 0);
        acc[clientId].totalRevenue += revenue;
        acc[clientId].totalWeight += Number(trip.pesoToneladas || 0);
        return acc;
    }, {} as Record<string, ClientGroup>);

    const filteredGrouped = (Object.entries(groupedTrips) as [string, ClientGroup][]).filter(([cid, data]) => {
        const matchesClient = !selectedClientId || cid === selectedClientId;
        const matchesSearch = !searchTerm ||
            data.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.trips.some((t: any) => (t.numeroCP || '').includes(searchTerm));
        return matchesClient && matchesSearch;
    });

    const handleSelectAllInClient = (tripsInClient: any[]) => {
        const allIds = tripsInClient.map(t => t.id);
        const allSelected = allIds.every(id => selectedTripIds.includes(id));
        if (allSelected) {
            setSelectedTripIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            setSelectedTripIds(prev => Array.from(new Set([...prev, ...allIds])));
        }
    };

    const handleGenerateProforma = async (cid: string, tids: string[]) => {
        if (tids.length === 0) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/finance-v3/lotes-dador`, {
                tenantId,
                clientId: cid,
                tripIds: tids
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Proforma generada exitosamente');
            setSelectedTripIds(prev => prev.filter(id => !tids.includes(id)));
            fetchData();
        } catch (err) {
            alert('Error al generar proforma');
        }
    };

    const handleConciliate = async (loteId: string) => {
        if (!confirm('¿Confirma que ha recibido el pago de esta proforma?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/finance-v3/lotes-dador/${loteId}/conciliate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Error al conciliar');
        }
    };

    const handleDownload = async (loteId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/finance-v3/lotes-dador/${loteId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Proforma-${loteId.split('-')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Error al descargar');
        }
    };

    const isMobile = windowWidth < 768;

    if (!tenantId) return <div style={{ padding: '2rem', color: 'white' }}>Seleccione una empresa para operar.</div>;

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', color: 'white', maxWidth: '1600px', margin: '0 auto' }}>

            <VisualHelpCard
                sectionId="cobranzas"
                title="Cobranzas a Dadores"
                onStartTour={() => setShowTour(true)}
                description="Acá es donde gestionás el dinero que te deben los clientes. El objetivo es juntar los viajes ya entregados y armar una 'Proforma' (un resumen de cuenta) para que el cliente te pague."
                concepts={[
                    { term: "Dador", explanation: "Es el cliente que nos contrató para llevar la carga." },
                    { term: "Proforma", explanation: "Es como un ticket o factura provisoria que resume muchos viajes para cobrar todo junto." },
                    { term: "Conciliar", explanation: "Simplemente significa apretar el botón cuando el cliente ya te mandó la plata." }
                ]}
                steps={[
                    "Elegí un cliente de la lista de abajo.",
                    "Marcá con el circulito los viajes que querés cobrar.",
                    "Tocá el botón azul que dice 'PROFORMA'.",
                    "Descargá el papel (PDF) y mandaselo al cliente."
                ]}
                tips={[
                    "Si ves algo en ROJO, significa que ya pasaron más de 7 días y el cliente todavía no te pagó. ¡Es hora de llamar!",
                    "Podés elegir todos los viajes de un cliente de una sola vez tocando el cuadrado de arriba."
                ]}
            />

            {/* DASHBOARD DE KPIs */}
            <div id="tour-collect-kpis" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '2rem' }}>
                <div id="tour-collect-kpi-pending" className="glass-panel" style={{ padding: isMobile ? '1rem' : '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        POR PROFORMAR <Clock size={14} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>${kpis.totalPendingProforma.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>Fletes de viajes finalizados por liquidar</div>
                </div>
                <div id="tour-collect-kpi-awaiting" className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        A COBRAR (PROFORMADO) <FileText size={14} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>${kpis.totalAwaitingPayment.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>Pendiente de conciliación</div>
                </div>
                <div id="tour-collect-kpi-critical" className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        VIAJES CRÍTICOS <AlertCircle size={14} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444' }}>{kpis.criticalTripsCount}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>Sin proformar {'>'} 7 días</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-green)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        RECAUDACIÓN MES <TrendingUp size={14} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success-green)' }}>${kpis.monthlyCollected.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem' }}>Total conciliado Marzo</div>
                </div>
            </div>

            {/* HEADER Y FILTROS */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                marginBottom: '2rem',
                gap: '1.5rem'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800 }}>Gestión de Cobranzas a Dadores</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Lifecycle: Proformado e Ingesta de Pagos</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                    <div id="tour-collect-tabs" className="glass-panel" style={{ display: 'flex', padding: '0.3rem', borderRadius: '12px', flex: isMobile ? 1 : 'none' }}>
                        <button
                            onClick={() => setActiveTab('pending')}
                            style={{ flex: 1, padding: '0.5rem 1rem', background: activeTab === 'pending' ? 'var(--accent-blue)' : 'transparent', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? '0.7rem' : '0.85rem' }}
                        >
                            PENDIENTES ({trips.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{ flex: 1, padding: '0.5rem 1rem', background: activeTab === 'history' ? 'var(--accent-blue)' : 'transparent', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? '0.7rem' : '0.85rem' }}
                        >
                            HISTORIAL ({lotes.length})
                        </button>
                    </div>
                    <button onClick={fetchData} className="glass-panel" style={{ padding: '0.75rem', cursor: 'pointer', border: 'none', color: 'white' }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {activeTab === 'pending' ? (
                <>
                    <div id="tour-collect-filters" className="glass-panel" style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '1rem'
                    }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Buscar por dador o Referencia de Viaje..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                            />
                        </div>
                        <select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            style={{ padding: '0.75rem', background: '#1e293b', border: 'none', color: 'white', borderRadius: '12px', width: isMobile ? '100%' : '250px' }}
                        >
                            <option value="">Todos los Dadores</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nombreRazonSocial}</option>)}
                        </select>
                    </div>

                    {/* LEYENDA VISUAL SEMAFORO */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.75rem',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={14} /> Antigüedad de Cobro:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}></div>
                            <span style={{ fontWeight: 600 }}>0-3 días: Reciente</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)' }}></div>
                            <span style={{ fontWeight: 600 }}>4-7 días: Preparar Cobro</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}></div>
                            <span style={{ fontWeight: 800, color: '#fca5a5' }}>+7 días: RECLAMAR PAGO</span>
                        </div>
                    </div>
                    <div id="tour-collect-list">
                        {filteredGrouped.map(([cid, data]) => (
                            <div key={cid} className="glass-panel" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'flex-start' : 'center',
                                        background: 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer',
                                        gap: '1rem'
                                    }}
                                    onClick={() => toggleClientExpand(cid)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {expandedClients[cid] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: isMobile ? '1rem' : '1.1rem' }}>{data.clientName}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{data.trips.length} viajes acumulados • {data.totalWeight.toFixed(2)} TN</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: isMobile ? 'flex-end' : 'center',
                                        justifyContent: 'space-between',
                                        width: isMobile ? '100%' : 'auto',
                                        gap: '2rem'
                                    }}>
                                        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>PENDIENTE SEGÚN TARIFAS PACTADAS</div>
                                            <div style={{ fontWeight: 900, color: 'var(--accent-blue)', fontSize: isMobile ? '1.1rem' : '1.2rem' }}>${data.totalRevenue.toLocaleString()}</div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const clientTids = selectedTripIds.filter(id => data.trips.some((t: any) => t.id === id));
                                                handleGenerateProforma(cid, clientTids);
                                            }}
                                            disabled={!selectedTripIds.some(id => data.trips.some((t: any) => t.id === id))}
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}
                                        >
                                            PROFORMA ({selectedTripIds.filter(id => data.trips.some((t: any) => t.id === id)).length})
                                        </button>
                                    </div>
                                </div>

                                {expandedClients[cid] && (
                                    <div style={{ padding: '0 1rem 1rem', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '700px' : 'auto' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', opacity: 0.4, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                    <th style={{ padding: '1rem' }}>
                                                        <div onClick={(e) => { e.stopPropagation(); handleSelectAllInClient(data.trips); }} style={{ cursor: 'pointer' }}>
                                                            {data.trips.every((t: any) => selectedTripIds.includes(t.id)) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </div>
                                                    </th>
                                                    <th id="tour-collect-col-ref">Ref. Viaje</th>
                                                    <th>Fecha</th>
                                                    <th style={{ textAlign: 'right' }}>Toneladas</th>
                                                    <th id="tour-collect-col-rate" style={{ textAlign: 'right' }}>Tarifa Pactada</th>
                                                    <th id="tour-collect-col-age" style={{ textAlign: 'center' }}>Antigüedad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.trips.map((t: any) => (
                                                    <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <div onClick={() => {
                                                                setSelectedTripIds(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id]);
                                                            }} style={{ cursor: 'pointer' }}>
                                                                {selectedTripIds.includes(t.id) ? <CheckSquare size={16} color="var(--accent-blue)" /> : <Square size={16} />}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{t.numeroCP || t.id.split('-')[0]}</td>
                                                        <td style={{ opacity: 0.7 }}>{new Date(t.tsCreacion).toLocaleDateString()}</td>
                                                        <td style={{ textAlign: 'right' }}>{Number(t.pesoToneladas).toFixed(2)}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 800, color: Number(t.revenueAtExecution || t.precioCongelado || 0) === 0 ? '#ef4444' : 'inherit' }}>
                                                            ${Number(t.revenueAtExecution || t.precioCongelado || 0).toLocaleString()}
                                                            <span style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', fontStyle: 'italic', marginTop: '2px' }}>
                                                                {t.appliedRuleInfo || (Number(t.revenueAtExecution) === 0 && Number(t.precioCongelado) > 0 ? 'Tarifa Fija ADT' : 'Tarifa Manual')}
                                                            </span>
                                                            {Number(t.revenueAtExecution || t.precioCongelado || 0) === 0 && <span style={{ fontSize: '0.6rem', marginLeft: '0.5rem', display: 'block' }}>(Sin Tarifa)</span>}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', borderRadius: '100px', background: `${getTripAgeColor(t.tsCreacion)}22`, color: getTripAgeColor(t.tsCreacion), fontSize: '0.65rem', fontWeight: 800 }}>
                                                                {Math.floor((Date.now() - new Date(t.tsCreacion).getTime()) / (1000 * 60 * 60 * 24))} DÍAS
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* VISTA DE HISTORIAL */
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '900px' : 'auto' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '1rem' }}>Lote ID</th>
                                <th>Cliente</th>
                                <th>Fecha Gen.</th>
                                <th>Último Intento</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Total Neto</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotes.map((l: any) => (
                                <React.Fragment key={l.id}>
                                    <tr style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '1.25rem 1rem', fontWeight: 800 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => toggleLoteExpand(l.id)}
                                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                                                >
                                                    {expandedLotes[l.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                #{l.id.split('-')[0]}
                                            </div>
                                        </td>
                                        <td>{l.client?.nombreRazonSocial}</td>
                                        <td style={{ opacity: 0.7 }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                                        <td style={{ opacity: 0.7 }}>{new Date(l.updatedAt || l.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div style={{
                                                display: 'inline-flex', padding: '0.25rem 0.6rem', borderRadius: '6px',
                                                background: l.status === 'CONCILIADO' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                                color: l.status === 'CONCILIADO' ? '#4ade80' : '#38bdf8',
                                                fontSize: '0.65rem', fontWeight: 900
                                            }}>
                                                {l.status}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '1rem' }}>${Number(l.totalNeto).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => handleDownload(l.id)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Descargar PDF">
                                                    <Download size={14} />
                                                </button>
                                                {l.status === 'PROFORMADO' && (
                                                    <button onClick={() => handleConciliate(l.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: '#22c55e', color: 'black' }}>
                                                        <CheckCircle2 size={14} style={{ marginRight: '0.4rem' }} /> COBRADO
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedLotes[l.id] && (
                                        <tr>
                                            <td colSpan={7} style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem 3rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem' }}>VIAJES INCLUIDOS EN ESTA PROFORMA</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    {l.trips?.map((t: any) => (
                                                        <div key={t.id} style={{ padding: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t.numeroCP || 'N/A'}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>${Number(t.precioDadorSnap || 0).toLocaleString()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showTour && (
                <VisualTourOverlay
                    onClose={() => setShowTour(false)}
                    steps={[
                        {
                            elementId: 'tour-collect-kpi-pending',
                            title: 'Por Proformar',
                            content: 'Es dinero de viajes que ya se entregaron pero todavía no le pasaste la "cuenta" al cliente. ¡Son fletes listos para facturar!',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-collect-kpi-awaiting',
                            title: 'En Espera de Pago',
                            content: 'Son resúmenes que ya mandaste al cliente. Estás esperando que te llegue el comprobante de transferencia.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-collect-kpi-critical',
                            title: '¡Alerta Roja!',
                            content: 'Son viajes que tienen más de 7 días de antiguedad y todavía no los incluiste en ninguna proforma. ¡Cuidado que se te escapa la cobranza!',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-collect-tabs',
                            title: 'Pendientes vs Historial',
                            content: 'Usa "Pendientes" para armar nuevos cobros y "Historial" para ver lo que ya mandaste y confirmar cuando el cliente pague.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-collect-filters',
                            title: 'Buscador de Clientes',
                            content: 'Si tienes muchos clientes, usa esto para encontrar rápido a uno solo y ver cuánto te debe.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-collect-col-ref',
                            title: 'Referencia / CP',
                            content: 'Es el número de la Carta de Porte o el identificador del viaje para que el cliente sepa qué le estás cobrando.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-collect-col-rate',
                            title: 'Tarifa Pactada',
                            content: 'Es el precio que acordaste con el cliente por ese viaje. Es lo que realmente te va a ingresar de dinero.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-collect-col-age',
                            title: 'Semáforo de Antigüedad',
                            content: 'Verde: Reciente. \nAmarillo: Momento de cobrar. \nRojo: ¡Pasaron 7 días! El cliente ya debería haber pagado.',
                            position: 'left'
                        }
                    ]}
                />
            )}
        </div>
    );
}
