import { API_BASE_URL } from '../config';
import { FileText, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';



export default function Reportes({ tenantId }: { tenantId: string | null }) {
    const [units, setUnits] = useState<any[]>([]);

    useEffect(() => {
        if (!tenantId) return;
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/management/units?tenantId=${tenantId}`);
                setUnits(res.data);
            } catch (err) {
                console.error('Error fetching units for report', err);
            } finally {
                // setLoading(false);
            }
        };
        fetchData();
    }, [tenantId]);

    const expiringUnits = units.filter(u => {
        if (!u.vencimientoVTV) return false;
        const diff = new Date(u.vencimientoVTV).getTime() - new Date().getTime();
        return diff < 30 * 24 * 60 * 60 * 1000; // 30 days
    });

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <FileText size={32} color="var(--accent-blue)" />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Centro de Reportes</h1>
            </div>

            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#fbbf24' }}>
                        <AlertTriangle size={20} />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Alertas de Vencimiento (VTV/Seguro)</h3>
                    </div>
                    {expiringUnits.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>No hay vencimientos próximos en los próximos 30 días.</p>
                    ) : (
                        expiringUnits.map(u => (
                            <div key={u.id} style={{ padding: '0.75rem', background: 'rgba(251, 191, 36, 0.05)', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{u.patente}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>VTV vence: {u.vencimientoVTV}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Clock size={20} />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Mantenimiento por KM</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Próximamente: Integración con odómetro para alertas de service.</p>
                </div>
            </div>
        </div>
    );
}
