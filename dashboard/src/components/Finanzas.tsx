import { CreditCard, History, Building, Calendar, CheckCircle2, Search, Ticket, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import VisualHelpCard from './common/VisualHelpCard';
import VisualTourOverlay from './common/VisualTourOverlay';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Finanzas({ tenantId }: { tenantId: string | null }) {
    const [balance, setBalance] = useState({
        totalAmountOwed: 0,
        totalDirectDebt: 0,
        totalUpchargeDebt: 0,
        totalNewTripsCount: 0,
        totalUsedValesCount: 0,
        totalPaid: 0,
        costPerUnit: 0,
        credits: 0,
        breakdown: [],
        pricingHistory: [],
        history: [],
        payments: [],
        totalDespachos: 0,
        aging: []
    });
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showPricingHistory, setShowPricingHistory] = useState(false);
    const [showDebtDetail, setShowDebtDetail] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number | string>('');
    const [showTour, setShowTour] = useState(false);

    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        if (!tenantId) return;
        const fetchFinance = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('admin_token');
                const financeUrl = `${API_BASE_URL}/finance-v3/report?tenantId=${tenantId}&month=${month}&year=${year}${selectedClientId ? `&clientId=${selectedClientId}` : ''}`;
                const [financeRes, paymentsRes] = await Promise.all([
                    axios.get(financeUrl, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/management/tenants/${tenantId}/payments`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                const totalPaid = paymentsRes.data.reduce((s: number, p: any) => s + Number(p.monto), 0);

                setBalance({
                    ...financeRes.data,
                    breakdown: Array.isArray(financeRes.data?.breakdown) ? financeRes.data.breakdown : [],
                    history: Array.isArray(financeRes.data?.history) ? financeRes.data.history : [],
                    aging: Array.isArray(financeRes.data?.aging) ? financeRes.data.aging : [],
                    totalPaid
                });
            } catch (err) {
                console.error('Error fetching finance data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinance();
    }, [tenantId, month, year, selectedClientId]);
    const handleExport = async () => {
        if (!tenantId) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/finance-v3/export-excel`, {
                params: {
                    tenantId,
                    month,
                    year,
                    clientId: selectedClientId || undefined
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Finanzas_${month}_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error al exportar Excel:", err);
            alert("Error al generar el reporte Excel");
        }
    };

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--accent-blue)', fontWeight: 700 }}>Cargando Estado de Cuenta...</div>;
    }

    const currentMonthConsolidated = (balance.totalDirectDebt || 0) + (balance.totalUpchargeDebt || 0);
    const previousDebt = Math.max(0, (balance.totalAmountOwed || 0) - currentMonthConsolidated);
    const hasPreviousDebt = previousDebt > 0;


    return (
        <div style={{ padding: '2rem' }}>
            <VisualHelpCard
                sectionId="finanzas_adt"
                title="Estado de Cuenta ADT"
                onStartTour={() => setShowTour(true)}
                description="Este es el resumen de lo que tu empresa le debe a ADT por el uso del sistema. Recordá que ADT te cobra por cada 'Carta de Porte' (viaje) que generás."
                concepts={[
                    { term: "Saldo Pendiente", explanation: "Es el total de dinero que debés a ADT por los viajes hechos y ajustes de precio." },
                    { term: "Ajuste Inflación", explanation: "Si usás un crédito de un viaje anulado hace tiempo y el precio subió, pagás solo la diferencia." },
                    { term: "Créditos Disponibles", explanation: "Cuando anulás un viaje, el sistema te devuelve el cupo para que lo uses en otro viaje sin pagar de nuevo el total." }
                ]}
                steps={[
                    "Revisá el 'Saldo Pendiente' para saber cuánto pagar.",
                    "Mirá el 'Consumo por Dador' para saber qué cliente te generó más gastos.",
                    "Si tenés dudas, tocá 'VER DETALLE' en el cuadro rojo."
                ]}
            />
            <style>{`
                @media (max-width: 768px) {
                    .finance-header { flex-direction: column; align-items: flex-start !important; gap: 1.5rem; }
                    .header-filters { width: 100%; justify-content: space-between; flex-wrap: wrap; }
                    .mobile-stack { grid-template-columns: 1fr !important; }
                    .glass-panel { padding: 1rem !important; }
                    .table-container { margin: 0 -1rem; border-radius: 0 !important; border-left: none; border-right: none; }
                }
            `}</style>

            <div className="finance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div id="tour-finance-intro" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <CreditCard size={32} color="var(--accent-blue)" />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Estado de Cuenta ADT</h1>
                    </div>
                    <button
                        onClick={handleExport}
                        style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            color: '#4ade80',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <Download size={14} /> EXPORTAR EXCEL
                    </button>
                </div>

                <div className="glass-panel header-filters" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={16} opacity={0.5} />
                        <select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer', maxWidth: '120px' }}
                        >
                            <option value="" style={{ background: '#1e293b' }}>TODOS</option>
                            {balance.breakdown.map((b: any) => (
                                <option key={b.id} value={b.id} style={{ background: '#1e293b' }}>{b.nombre.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.25rem' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} opacity={0.5} />
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1} style={{ background: '#1e293b' }}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y} style={{ background: '#1e293b' }}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>— Estado General de Cuenta</h3>
                <div id="tour-finance-summary" className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div id="tour-finance-debt" className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f87171', background: 'rgba(248, 113, 113, 0.05)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="text-secondary" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Saldo Pendiente a Pagar</div>
                            <button
                                onClick={() => setShowDebtDetail(true)}
                                style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', color: '#f87171', padding: '0.2rem 0.6rem', fontSize: '0.6rem', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                VER DETALLE
                            </button>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f87171' }}>${(balance.totalAmountOwed || 0).toLocaleString('es-AR')}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.9, marginTop: '0.5rem', fontWeight: 700 }}>
                            {hasPreviousDebt ? 'Incluye deuda previa de meses anteriores' : 'Saldo total acumulado al día de hoy'}
                        </div>
                    </div>

                    <div id="tour-finance-credits" className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
                        <div className="text-secondary" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Créditos Disponibles</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-blue)' }}>{(Number(balance.credits) || 0).toLocaleString('es-AR')} CP</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.5rem' }}>Créditos por viajes anulados listos para usar</div>
                    </div>

                    <div id="tour-finance-payments" className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-green)' }}>
                        <div className="text-secondary" style={{ fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Pagos Recibidos</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success-green)' }}>${(balance.totalPaid || 0).toLocaleString('es-AR')}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '0.5rem' }}>Recaudación total del período seleccionado</div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>— Actividad del Mes ({new Date(2000, month - 1).toLocaleString('default', { month: 'long' }).toUpperCase()})</h3>
                <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-blue)' }}>
                        <div className="text-secondary" style={{ fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Despachos</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{balance.totalDespachos || 0}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.8, marginTop: '0.4rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                            {balance.totalNewTripsCount} Nuevos + {balance.totalUsedValesCount} con Vale
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid #fbbf24' }}>
                        <div className="text-secondary" style={{ fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 800, textTransform: 'uppercase' }}>Consumo Nuevo (Mes)</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>${(balance.totalDirectDebt || 0).toLocaleString('es-AR')}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '0.4rem' }}>Por las {balance.totalNewTripsCount} CPs nuevas de este período</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid #60a5fa' }}>
                        <div className="text-secondary" style={{ fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 800, textTransform: 'uppercase' }}>Ajuste Inflación</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>${(balance.totalUpchargeDebt || 0).toLocaleString('es-AR')}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '0.4rem' }}>Diferenciales por uso de vales ante aumento</div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-blue)', position: 'relative', zIndex: showPricingHistory ? 1000 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="text-secondary" style={{ fontSize: '0.65rem', marginBottom: '0.25rem', fontWeight: 800, textTransform: 'uppercase' }}>Tarifa CP Vigente</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-blue)' }}>${(balance.costPerUnit || 0).toLocaleString('es-AR')}</div>
                            </div>
                            <button
                                onClick={() => setShowPricingHistory(!showPricingHistory)}
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--accent-blue)', padding: '0.2rem 0.4rem', fontSize: '0.6rem', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                {showPricingHistory ? 'CERRAR' : 'HISTORIAL'}
                            </button>
                        </div>

                        {showPricingHistory && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 2000,
                                padding: '1.25rem',
                                marginTop: '0.5rem',
                                background: '#1e293b',
                                border: '1px solid var(--accent-blue)',
                                borderRadius: '12px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                            }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, marginBottom: '0.75rem', opacity: 0.5, color: 'white' }}>EVOLUCIÓN DE PRECIOS ADT</div>
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {balance.pricingHistory.slice(0, 5).map((p: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                                            <span style={{ opacity: 0.7 }}>{new Date(p.fechaDesde || p.createdAt).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 800 }}>${Number(p.precioCp).toLocaleString('es-AR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem', opacity: 0.5, fontSize: '0.65rem', fontStyle: 'italic', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                <History size={12} />
                <span>Auditoría para Dueño ADT: Todo despacho creado se factura al tenant. Los viajes anulados no se descuentan de la deuda, sino que generan un crédito a favor del tenant.</span>
            </div>

            <div id="tour-finance-breakdown" className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Building size={20} color="var(--accent-blue)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Consumo de CPs por Dador de Carga</h2>
                    </div>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
                        <input
                            type="text"
                            placeholder="Buscar dador..."
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', fontSize: '0.8rem' }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: '400px', overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1a1f2b' }}>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--glass-border)', fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>
                                <th id="tour-finance-col-dador" style={{ padding: '1rem' }}>Dador</th>
                                <th id="tour-finance-col-despachos" style={{ padding: '1rem' }}>Despachos</th>
                                <th id="tour-finance-col-concredito" style={{ padding: '1rem' }}>Con Crédito</th>
                                <th id="tour-finance-col-deudacps" style={{ padding: '1rem' }}>Deuda CPs</th>
                                <th id="tour-finance-col-ajustecreditos" style={{ padding: '1rem' }}>Ajuste Créditos</th>
                                <th id="tour-finance-col-totaldeuda" style={{ padding: '1rem' }}>Total Deuda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balance.breakdown && balance.breakdown.length > 0 ? (
                                balance.breakdown
                                    .filter((b: any) => b.nombre.toLowerCase().includes(clientSearch.toLowerCase()))
                                    .map((b: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 800 }}>{b.nombre}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{b.totalCps || 0}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {b.usedValesCount > 0 && <Ticket size={14} color="var(--accent-blue)" />}
                                                    <div style={{
                                                        fontWeight: 800,
                                                        color: b.usedValesCount > 0 ? 'var(--accent-blue)' : 'white',
                                                        background: b.usedValesCount > 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                        padding: b.usedValesCount > 0 ? '2px 6px' : '0',
                                                        borderRadius: '4px',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {b.usedValesCount || 0}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.2rem' }}>({b.credits || 0} disponibles)</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>${(b.directDebt || 0).toLocaleString('es-AR')}</div>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>({b.newTripsCount} CP a valor histórico)</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: '#60a5fa' }}>${(b.upchargeDebt || 0).toLocaleString('es-AR')}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 900, color: '#f87171' }}>${(b.amountOwed || 0).toLocaleString('es-AR')}</div>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }} className="text-secondary">No hay actividad registrada en este período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="mobile-stack">
                <div id="tour-finance-trips" className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <History size={20} color="var(--accent-blue)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Últimos Viajes (Deuda)</h2>
                    </div>
                    <div className="table-container" style={{ maxHeight: '400px', overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                            <tbody>
                                {balance.history && balance.history.length > 0 ? (
                                    balance.history.map((h: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 800 }}>{h.referencia}</div>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(h.fecha).toLocaleDateString()}</div>
                                                {h.esCredito && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                                                            USO DE CRÉDITO
                                                        </span>
                                                        {h.upchargeAmount > 0 && (
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--accent-blue)', opacity: 0.8 }}>
                                                                (+${Number(h.upchargeAmount).toLocaleString('es-AR')} Dif.)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>
                                                ${Number(h.costo).toLocaleString('es-AR')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td style={{ padding: '2rem', textAlign: 'center' }} className="text-secondary">Sin viajes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="tour-finance-payments-table" className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <CheckCircle2 size={20} color="var(--success-green)" />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recaudación ADT (Pagos)</h2>
                    </div>
                    <div className="table-container" style={{ maxHeight: '400px', overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                            <tbody>
                                {balance.payments && balance.payments.length > 0 ? (
                                    balance.payments.map((p: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 800 }}>Pago Recibido</div>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(p.fechaPago).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--success-green)' }}>
                                                +${Number(p.monto).toLocaleString('es-AR')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td style={{ padding: '2rem', textAlign: 'center' }} className="text-secondary">Sin pagos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showDebtDetail && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2rem', border: '1px solid #f87171', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <CreditCard size={24} color="#f87171" />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Desglose de Deuda</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {balance.aging && balance.aging.length > 0 ? (
                                balance.aging.map((item: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '2px solid rgba(248, 113, 113, 0.3)' }}>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.periodo}:</span>
                                        <span style={{ fontWeight: 800 }}>${Number(item.monto).toLocaleString('es-AR')}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ opacity: 0.6 }}>Deuda Mes actual:</span>
                                    <span style={{ fontWeight: 800 }}>${currentMonthConsolidated.toLocaleString('es-AR')}</span>
                                </div>
                            )}

                            <div style={{ height: '1px', background: 'rgba(248, 113, 113, 0.3)', margin: '1rem 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                                <span style={{ fontWeight: 800, color: '#f87171' }}>TOTAL A PAGAR:</span>
                                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#f87171' }}>${(balance.totalAmountOwed || 0).toLocaleString('es-AR')}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowDebtDetail(false)}
                            style={{
                                marginTop: '2rem',
                                width: '100%',
                                padding: '1rem',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            CERRAR ENTENDIDO
                        </button>
                    </div>
                </div>
            )}
            {showTour && (
                <VisualTourOverlay
                    onClose={() => setShowTour(false)}
                    steps={[
                        {
                            elementId: 'tour-finance-intro',
                            title: 'Bienvenido a Finanzas',
                            content: 'Esta sección sirve para llevar el control total de lo que tu empresa consume en el sistema ADT. Aquí verás qué debés, qué pagaste y cómo se mueve tu dinero.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-debt',
                            title: 'Resumen de Deuda',
                            content: 'Este es tu Saldo Pendiente. Es el dinero total de los fletes que ADT te facturó por los viajes generados.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-finance-credits',
                            title: 'Créditos por Anulación',
                            content: 'IMPORTANTE: Estos NO son paquetes comprados. Son viajes que ANULASTE. Si el precio de la CP aumentó desde que anulaste el viaje hasta que usaste el crédito, acá verás el ajuste (solo pagás la diferencia).',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-finance-payments',
                            title: 'Pagos Confirmados',
                            content: 'Aquí ves el total de dinero que ADT ya recibió y confirmó de tus transferencias.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-finance-col-dador',
                            title: 'Columna: Dador',
                            content: 'Es el nombre de tu cliente o cargador a quien le hiciste los viajes.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-col-despachos',
                            title: 'Columna: Despachos',
                            content: 'Es la cantidad total de viajes que generaste para este cliente en este periodo.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-col-concredito',
                            title: 'Columna: Con Crédito',
                            content: 'Aquí ves cuántos de esos viajes NO pagaste el flete completo porque usaste un crédito de un viaje anulado anteriormente.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-col-deudacps',
                            title: 'Columna: Deuda CPs',
                            content: 'Es el costo total de los viajes nuevos (los que no usaron crédito) que le debés a ADT.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-col-ajustecreditos',
                            title: 'Columna: Ajuste Créditos',
                            content: 'Si usaste un crédito y el precio de la Carta de Porte subió, aquí se muestra esa pequeña diferencia inflacionaria.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-col-totaldeuda',
                            title: 'Columna: Total Deuda',
                            content: 'Es la suma final de "Deuda CPs" más el "Ajuste Créditos". Es lo que realmente suma a tu saldo a pagar por este cliente.',
                            position: 'bottom'
                        },
                        {
                            elementId: 'tour-finance-trips',
                            title: 'Detalle de Viajes',
                            content: 'Aquí ves uno por uno los últimos viajes que generaron deuda en tu cuenta.',
                            position: 'top'
                        },
                        {
                            elementId: 'tour-finance-payments-table',
                            title: 'Historial de Pagos',
                            content: 'Este es el listado detallado de todas las transferencias que hiciste a ADT.',
                            position: 'top'
                        }
                    ]}
                />
            )}
        </div>
    );
}
