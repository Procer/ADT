import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, CheckCircle, Clock, FileText } from 'lucide-react';



export default function SettlementsManager({ tenantId }: { tenantId: string | null }) {
    const [batches, setBatches] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [_loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, _setYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/finance/settlements-v2?tenantId=${tenantId}&entityType=CHOFER&month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(Array.isArray(res.data?.items) ? res.data.items : []);
            setStats(res.data.stats);
        } catch (err) {
            console.error('Error fetching settlements', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId, month, year]);

    if (!tenantId) return <div style={{ padding: '2rem' }}>Seleccione una empresa para ver sus liquidaciones.</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Truck color="var(--accent-blue)" /> Liquidaciones a Choferes
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Control de ciclos de pago y batches generados para transportistas</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="glass-panel" style={{ background: '#1e293b', padding: '0.5rem', border: 'none', color: 'white' }}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                </div>
            </div>

            {stats && (
                <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f87171' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total a Pagar</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>${stats.totalNet.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Suma de todos los ciclos del periodo</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-green)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pagados</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success-green)' }}>{stats.paid}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Batches con estado PAID</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #fbbf24' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pendientes</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>{stats.pending}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Requieren acción de pago</div>
                    </div>
                </div>
            )}

            <div className="glass-panel">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>
                            <th style={{ padding: '1rem' }}>Ciclo / Fecha</th>
                            <th style={{ padding: '1rem' }}>Chofer ID (Ref)</th>
                            <th style={{ padding: '1rem' }}>Periodo</th>
                            <th style={{ padding: '1rem' }}>Monto Neto</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay liquidaciones generadas para este periodo.</td></tr>
                        ) : (
                            batches.map(b => (
                                <tr key={b.id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 700 }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>ID: {b.id.slice(0, 8)}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{b.entityId.slice(0, 8)}...</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.75rem' }}>{new Date(b.periodStart).toLocaleDateString()} - {new Date(b.periodEnd).toLocaleDateString()}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 900 }}>${Number(b.totalNet).toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            background: b.status === 'PAID' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                            color: b.status === 'PAID' ? '#4ade80' : '#fbbf24',
                                            fontSize: '0.65rem',
                                            fontWeight: 800
                                        }}>
                                            {b.status === 'PAID' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {b.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {b.pdfUrl && (
                                                <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                                                    <FileText size={14} /> PDF
                                                </button>
                                            )}
                                            <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>DETALLE</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
