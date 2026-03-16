import { ShieldCheck, Filter, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Auditorias({ tenantId }: { tenantId: string | null }) {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('admin_token');
                const res = await axios.get(`${API_BASE_URL}/management/audits?tenantId=${tenantId || ''}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAudits(res.data);
            } catch (err) {
                console.error('Error fetching audits', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, [tenantId]);

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldCheck size={32} color="var(--accent-blue)" />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Libro de Auditoría Silenciosa</h1>
                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Registro histórico de eventos e integridad del sistema.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px' }}>
                        <Filter size={18} />
                        Filtrar
                    </button>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px' }}>
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', opacity: 0.6 }}>FECHA / HORA</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', opacity: 0.6 }}>EVENTO</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', opacity: 0.6 }}>DETALLE</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', opacity: 0.6 }}>INTEGRIDAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center' }}>Consultando registros...</td></tr>
                        ) : audits.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center' }} className="text-secondary">No hay registros de auditoría para este período.</td></tr>
                        ) : (
                            audits.map(audit => (
                                <tr key={audit.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>{new Date(audit.fecha).toLocaleString()}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{audit.accion}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>{audit.descripcion || 'Validación automática de sistema'}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-green)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>FIRMA OK</span>
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
