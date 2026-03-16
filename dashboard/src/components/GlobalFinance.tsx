import { Calendar, CheckCircle2, List, TrendingUp, Search, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function GlobalFinance({ onSelectTenant }: { onSelectTenant: (id: string, view: string) => void }) {
    const [data, setData] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showPaymentModal, setShowPaymentModal] = useState<any>(null); // Guardará el tenant a cobrar
    const [showHistoryModal, setShowHistoryModal] = useState<any>(null); // Guardará el tenant para ver pagos
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [pendingTrips, setPendingTrips] = useState<any[]>([]);
    const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
    const [paymentData, setPaymentData] = useState({ monto: 0, referencia: '', metodo: 'Transferencia', comprobanteUrl: '', periodo: '' });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/finance-v3/finance/global?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error('Error fetching global finance', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingTrips = async (tenantId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/tenants/${tenantId}/pending-trips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingTrips(res.data);
            setSelectedTripIds([]);
            setPaymentData(prev => ({ ...prev, monto: 0 }));
        } catch (err) {
            console.error('Error fetching pending trips', err);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showPaymentModal) return;
        if (selectedTripIds.length === 0) return alert('Debe seleccionar al menos un viaje para conciliar.');

        try {
            const token = localStorage.getItem('admin_token');
            const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
            await axios.post(`${API_BASE_URL}/management/tenants/${showPaymentModal.tenantId}/record-payment`, {
                ...paymentData,
                tripIds: selectedTripIds,
                adminName: adminUser.nombreCompleto || 'Super Admin'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('¡Pago registrado y deuda conciliada con éxito!');
            setShowPaymentModal(null);
            setPaymentData({ monto: 0, referencia: '', metodo: 'Transferencia', comprobanteUrl: '', periodo: '' });
            setSelectedTripIds([]);
            fetchData();
        } catch (err) {
            alert('Error al registrar el pago');
        }
    };

    const toggleTripSelection = (id: string) => {
        setSelectedTripIds(prev => {
            const isSelected = prev.includes(id);
            const newList = isSelected ? prev.filter(tid => tid !== id) : [...prev, id];

            // Recalcular monto
            const newMonto = newList.reduce((sum, tid) => {
                const trip = pendingTrips.find(t => t.id === tid);
                const amount = trip?.esCredito ? Number(trip.montoUpcharge || 0) : Number(trip.precioCongelado || 0);
                return sum + amount;
            }, 0);
            setPaymentData(p => ({ ...p, monto: newMonto }));

            return newList;
        });
    };

    const fetchHistory = async (tenantId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/tenants/${tenantId}/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentHistory(res.data);
        } catch (err) {
            console.error('Error fetching history', err);
        }
    };

    const handleDeletePayment = async (paymentId: string, monto: number) => {
        if (!window.confirm(`¿Está seguro de eliminar este pago de $${monto}? La deuda del cliente aumentará automáticamente.`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`${API_BASE_URL}/management/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Pago eliminado y deuda revertida.');
            if (showHistoryModal) fetchHistory(showHistoryModal.tenantId);
            fetchData();
        } catch (err) {
            alert('Error al eliminar el pago');
        }
    };

    const handleSendSettlement = async (tenantId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${tenantId}/send-settlement?month=${month}&year=${year}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('¡Resumen de liquidación enviado correctamente por Telegram!');
        } catch (err: any) {
            alert('Error al enviar el resumen: ' + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const filtered = data.filter(d => d.nombreEmpresa.toLowerCase().includes(filter.toLowerCase()));

    const totalMoney = data.reduce((acc, curr) => acc + Number(curr.totalAmountOwed || 0), 0);

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
            <style>{`
                @media (max-width: 768px) {
                    .finance-header { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
                    .finance-controls { flex-direction: column !important; width: 100% !important; }
                    .control-item { width: 100% !important; justify-content: space-between !important; }
                    .table-container { overflow-x: auto !important; }
                    .payment-modal-content { grid-template-columns: 1fr !important; width: 95% !important; max-height: 95vh !important; }
                    .payment-modal-left { border-right: none !important; border-bottom: 1px solid var(--glass-border) !important; padding: 1.5rem !important; }
                    .payment-modal-right { padding: 1.5rem !important; }
                    .history-modal { width: 95% !important; padding: 1rem !important; }
                    .history-table th:nth-child(n+4), .history-table td:nth-child(n+4) { display: none !important; }
                }
            `}</style>

            <div className="finance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Métricas Globales ADT</h1>
                    <p style={{ opacity: 0.5, fontSize: '0.95rem', fontWeight: 500 }}>Control financiero corporativo y consolidado.</p>
                </div>

                <div className="finance-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass-panel control-item" style={{ padding: '0.6rem 1.25rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px' }}>
                        <TrendingUp size={18} color="#4ade80" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase' }}>TOTAL DEUDA GLOBAL</span>
                            <span style={{ fontWeight: 900, color: '#4ade80', fontSize: '1.25rem' }}>${(totalMoney || 0).toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    <div className="glass-panel control-item" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px' }}>
                        <Calendar size={18} opacity={0.5} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={month}
                                onChange={e => setMonth(Number(e.target.value))}
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1} style={{ background: '#0f172a' }}>
                                        {new Date(2000, i).toLocaleString('es-AR', { month: 'short' }).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="glass-panel control-item" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '12px' }}>
                        <Search size={18} opacity={0.4} />
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 600, outline: 'none', width: isMobile ? '100%' : '180px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel table-container" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '800px' : 'auto' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.5 }}>
                            <th style={{ padding: '1.25rem' }}>Empresa</th>
                            <th style={{ padding: '1.25rem' }}>Viajes</th>
                            <th style={{ padding: '1.25rem' }}>Vales Usados</th>
                            <th style={{ padding: '1.25rem' }}>A Cobrar</th>
                            <th style={{ padding: '1.25rem' }}>Deuda</th>
                            <th style={{ padding: '1.25rem' }}>Saldo Vales</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto' }} />
                                <p style={{ marginTop: '1rem', opacity: 0.5, fontWeight: 600 }}>Cargando inteligencia financiera...</p>
                            </td></tr>
                        ) : filtered.length > 0 ? (
                            filtered.map(t => (
                                <tr key={t.tenantId} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '1.25rem', fontWeight: 800 }}>{t.nombreEmpresa}</td>
                                    <td style={{ padding: '1.25rem' }}>{t.totalTrips}</td>
                                    <td style={{ padding: '1.25rem', color: '#4ade80', fontWeight: 700 }}>{t.paidTrips}</td>
                                    <td style={{ padding: '1.25rem', color: t.pendingTrips > 0 ? '#f87171' : 'inherit' }}>{t.pendingTrips}</td>
                                    <td style={{ padding: '1.25rem', fontWeight: 900, color: t.totalAmountOwed > 0 ? '#f87171' : 'inherit' }}>
                                        ${(t.totalAmountOwed || 0).toLocaleString('es-AR')}
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.3rem 0.6rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                            {t.availableCredits} VALES
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => onSelectTenant(t.tenantId, 'finanzas')}
                                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 800 }}
                                            >
                                                MÉTRICAS
                                            </button>
                                            <button
                                                onClick={() => handleSendSettlement(t.tenantId)}
                                                style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                            >
                                                <Send size={12} /> LIQ.
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowPaymentModal(t);
                                                    fetchPendingTrips(t.tenantId);
                                                }}
                                                style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900 }}
                                            >
                                                <CheckCircle2 size={12} /> COBRAR
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowHistoryModal(t);
                                                    fetchHistory(t.tenantId);
                                                }}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.6 }}
                                            >
                                                PAGOS
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} style={{ padding: '5rem', textAlign: 'center', opacity: 0.5, fontWeight: 600 }}>Sin registros financieros para este periodo.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Cobro Vinculado */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel payment-modal-content" style={{ width: '1000px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0', padding: '0', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>

                        {/* Lado Izquierdo: Selección de Viajes */}
                        <div className="payment-modal-left" style={{ padding: '2.5rem', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: isMobile ? '400px' : '85vh' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '14px' }}>
                                    <List size={24} color="var(--accent-blue)" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Conciliación Detalle</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {pendingTrips.length > 0 ? (
                                    Object.entries(
                                        pendingTrips.reduce((acc: any, trip: any) => {
                                            const clientName = trip.client?.nombreRazonSocial || 'Sin Cliente';
                                            if (!acc[clientName]) acc[clientName] = [];
                                            acc[clientName].push(trip);
                                            return acc;
                                        }, {})
                                    ).map(([clientName, trips]: [string, any]) => (
                                        <div key={clientName} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div
                                                onClick={() => {
                                                    const allIds = trips.map((t: any) => t.id);
                                                    const allSelected = allIds.every((id: string) => selectedTripIds.includes(id));

                                                    let nextSelectedIds: string[];
                                                    if (allSelected) {
                                                        // Deseleccionar todos los del cliente
                                                        nextSelectedIds = selectedTripIds.filter(id => !allIds.includes(id));
                                                    } else {
                                                        // Seleccionar todos los del cliente (union)
                                                        nextSelectedIds = [...new Set([...selectedTripIds, ...allIds])];
                                                    }

                                                    setSelectedTripIds(nextSelectedIds);

                                                    // Calcular nuevo monto
                                                    const newMonto = nextSelectedIds.reduce((sum, tid) => {
                                                        const trip = pendingTrips.find(t => t.id === tid);
                                                        return sum + (trip?.esCredito ? Number(trip.montoUpcharge || 0) : Number(trip.precioCongelado || 0));
                                                    }, 0);
                                                    setPaymentData(p => ({ ...p, monto: newMonto }));
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: trips.every((t: any) => selectedTripIds.includes(t.id)) ? 'var(--accent-blue)' : 'transparent' }}>
                                                    {trips.every((t: any) => selectedTripIds.includes(t.id)) && <CheckCircle2 size={10} color="white" />}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.8 }}>{clientName}</span>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>({trips.length} viajes)</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1rem' }}>
                                                {trips.map((trip: any) => (
                                                    <div
                                                        key={trip.id}
                                                        onClick={() => toggleTripSelection(trip.id)}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            background: selectedTripIds.includes(trip.id) ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                                                            border: selectedTripIds.includes(trip.id) ? '1px solid #6366f1' : '1px solid var(--glass-border)',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{trip.numeroCP}</div>
                                                            <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>{new Date(trip.tsCreacion).toLocaleDateString()}</div>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f87171' }}>
                                                            ${(trip.esCredito ? Number(trip.montoUpcharge || 0) : Number(trip.precioCongelado || 0)).toLocaleString('es-AR')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4, border: '1px dashed var(--glass-border)', borderRadius: '20px' }}>
                                        No hay deudas pendientes por liquidar.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lado Derecho: Formulario de Pago */}
                        <div className="payment-modal-right" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.015)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem' }}>Resumen de Cobro</h2>
                            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)', padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#4ade80', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>Monto a Conciliar</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>$</span>
                                        <input
                                            type="number"
                                            value={paymentData.monto}
                                            onChange={e => setPaymentData({ ...paymentData, monto: Number(e.target.value) })}
                                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '2.5rem', fontWeight: 950, width: '100%', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem', fontWeight: 600 }}>
                                        {selectedTripIds.length} viajes seleccionados para cancelación
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem', fontWeight: 800 }}>MÉTODO DE PAGO</label>
                                        <select
                                            value={paymentData.metodo}
                                            onChange={e => setPaymentData({ ...paymentData, metodo: e.target.value })}
                                            style={{ width: '100%', padding: '0.9rem', background: '#0f172a', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}
                                        >
                                            <option value="Transferencia">Transferencia Bancaria</option>
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Otro">Otro / Ajuste</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem', fontWeight: 800 }}># REFERENCIA O RECIBO</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Transf. 9921 / Recibo 342"
                                            required
                                            value={paymentData.referencia}
                                            onChange={e => setPaymentData({ ...paymentData, referencia: e.target.value })}
                                            style={{ width: '100%', padding: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={() => setShowPaymentModal(null)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 800 }}>CANCELAR</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 900 }}>CONFIRMAR COBRO</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Historial de Pagos */}
            {showHistoryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel history-modal" style={{ width: '850px', padding: '2.5rem', maxHeight: '85vh', overflowY: 'auto', borderRadius: '28px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Historial de Cobros: {showHistoryModal.nombreEmpresa}</h2>
                            <button onClick={() => setShowHistoryModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>CERRAR</button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>
                                        <th style={{ padding: '1rem' }}>Fecha</th>
                                        <th style={{ padding: '1rem' }}>Monto</th>
                                        <th style={{ padding: '1rem' }}>Referencia</th>
                                        <th style={{ padding: '1rem' }}>Método</th>
                                        <th style={{ padding: '1rem' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.length > 0 ? (
                                        paymentHistory.map((p: any, idx: number) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                                <td style={{ padding: '1rem' }}>{new Date(p.fechaPago).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontWeight: 900, color: '#4ade80' }}>${Number(p.monto).toLocaleString('es-AR')}</td>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.referencia}</td>
                                                <td style={{ padding: '1rem', opacity: 0.7 }}>{p.metodoPago}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => handleDeletePayment(p.id, p.monto)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef444433', color: '#f87171', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 800 }}
                                                    >
                                                        ANULAR
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', opacity: 0.4 }}>No se han registrado cobros para esta cuenta.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
