import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, CheckCircle2, Clock } from 'lucide-react';



export default function CollectionsManager({ tenantId }: { tenantId: string | null }) {
    const [collections, setCollections] = useState<any[]>([]);
    const [_loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            // Usamos el endpoint de créditos filtrado por tenant
            const res = await axios.get(`${API_BASE_URL}/management/credits/history?tenantId=${tenantId || ''}&month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollections(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching collections', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId, month, year]);

    const stats = {
        total: collections.reduce((acc, c) => acc + Number(c.montoPagado || 0), 0),
        count: collections.length,
        pending: collections.filter(c => !c.aprobado).length
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <DollarSign color="var(--success-green)" /> Cobranzas a Dadores de Carga
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Gestión de cobros por recargas de créditos realizadas por tus clientes</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="glass-panel" style={{ background: '#1e293b', padding: '0.5rem', border: 'none', color: 'white' }}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="glass-panel" style={{ background: '#1e293b', padding: '0.5rem', border: 'none', color: 'white' }}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-green)' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Cobrado</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>${stats.total.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success-green)', marginTop: '0.5rem' }}>{stats.count} recargas en el periodo</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #facc15' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pendientes de Aprobación</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Cargas que requieren verificación</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Periodo</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{new Date(2000, month - 1).toLocaleString('default', { month: 'short' }).toUpperCase()} {year}</div>
                </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>
                            <th style={{ padding: '1rem' }}>Fecha</th>
                            <th style={{ padding: '1rem' }}>Dador de Carga</th>
                            <th style={{ padding: '1rem' }}>Créditos ADT</th>
                            <th style={{ padding: '1rem' }}>Monto Pagado</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem' }}>Referencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collections.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay registros de cobranza para este periodo.</td></tr>
                        ) : (
                            collections.map(c => (
                                <tr key={c.id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 700 }}>{c.client?.nombreRazonSocial || 'Dador Desconocido'}</td>
                                    <td style={{ padding: '1rem', fontWeight: 800 }}>{c.cantidadCreditos} CPs</td>
                                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--success-green)' }}>${Number(c.montoPagado || 0).toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: c.aprobado ? 'var(--success-green)' : '#facc15', fontSize: '0.7rem', fontWeight: 800 }}>
                                            {c.aprobado ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                            {c.aprobado ? 'COBRADO' : 'PENDIENTE'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', opacity: 0.7, fontSize: '0.75rem' }}>{c.referenciaPago || 'S/R'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
