import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import VisualHelpCard from './common/VisualHelpCard';
import { Truck, Plus, Minus, RefreshCw, FileText, Download, User, Calendar } from 'lucide-react';
import VisualTourOverlay from './common/VisualTourOverlay';



export default function Finance360Settlements({ tenantId }: { tenantId: string | null }) {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [trips, setTrips] = useState<any[]>([]);
    const [lotes, setLotes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
    const [deductions, setDeductions] = useState<{ monto: number, descripcion: string, tipo: string }[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [historyFilterDriverId, setHistoryFilterDriverId] = useState('');
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
            const token = localStorage.getItem('admin_token');
            const resDrivers = await axios.get(`${API_BASE_URL}/management/drivers?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDrivers(resDrivers.data);

            if (selectedDriverId) {
                const resTrips = await axios.get(`${API_BASE_URL}/management/trips?tenantId=${tenantId}&choferId=${selectedDriverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filtrar por estados que representan un viaje terminado o llegando a destino y que no estén ya en un lote de pago
                setTrips(resTrips.data);
            }

            const resHistory = await axios.get(`${API_BASE_URL}/finance-v3/lotes-chofer?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLotes(resHistory.data);

        } catch (err) {
            console.error('Error fetching data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId, selectedDriverId]);

    const handleDownload = async (loteId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/finance-v3/lotes-chofer/${loteId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `liquidacion-${loteId.split('-')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Error al descargar PDF');
        }
    };

    const exportToCSV = () => {
        const selectedTrips = trips.filter(t => selectedTripIds.includes(t.id));
        const driver = drivers.find(d => d.id === selectedDriverId);

        let csv = `Liquidacion para: ${driver?.nombre || 'N/A'}\n`;
        csv += `Ciclo de Pago: ${driver?.paymentCycle || 'N/A'}\n`;
        csv += `Fecha Exportacion: ${new Date().toLocaleDateString()}\n\n`;
        csv += `ID;CP;Fecha;Monto Bruto\n`;

        selectedTrips.forEach(t => {
            csv += `${t.id};${t.numeroCP || 'S/N'};${new Date(t.tsCreacion).toLocaleDateString()};${t.costAtExecution || 0}\n`;
        });

        csv += `\nDeducciones\n`;
        csv += `Tipo;Descripcion;Monto\n`;
        deductions.forEach(d => {
            csv += `${d.tipo};${d.descripcion};${d.monto}\n`;
        });

        csv += `\nRESUMEN\n`;
        csv += `Total Bruto;${totalBruto}\n`;
        csv += `Total Deducciones;${totalDeducciones}\n`;
        csv += `NETO FINAL;${netoFinal}\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `liquidacion_${driver?.nombre || 'chofer'}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const addDeduction = () => {
        setDeductions(prev => [...prev, { monto: 0, descripcion: '', tipo: 'ANTICIPO' }]);
    };

    const removeDeduction = (index: number) => {
        setDeductions(prev => prev.filter((_, i) => i !== index));
    };

    const updateDeduction = (index: number, field: string, value: any) => {
        setDeductions(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: field === 'monto' ? Number(value) : value };
            return copy;
        });
    };

    const pendingTrips = trips.filter(t => (t.estado === 'ENTREGADO' || t.estado === 'FINALIZADO' || t.estado === 'LLEGUE') && !t.paymentLotId);
    const paidTrips = trips.filter(t => t.paymentLotId);

    const totalBruto = trips.filter(t => selectedTripIds.includes(t.id)).reduce((s, t) => s + Number(t.costAtExecution || 0), 0);
    const totalDeducciones = deductions.reduce((s, d) => s + d.monto, 0);
    const netoFinal = totalBruto - totalDeducciones;

    const selectedDriver = drivers.find(d => d.id === selectedDriverId);

    const handleConfirmSettlement = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/finance-v3/lotes-chofer`, {
                tenantId,
                choferId: selectedDriverId,
                tripIds: selectedTripIds,
                deductions
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Liquidación cerrada exitosamente');
            setShowConfirmModal(false);
            setSelectedTripIds([]);
            setDeductions([]);
            fetchData();
        } catch (err) {
            alert('Error al cerrar liquidación');
        }
    };

    const filteredHistory = historyFilterDriverId
        ? lotes.filter(l => l.choferId === historyFilterDriverId)
        : lotes;

    const isMobile = windowWidth < 768;

    if (!tenantId) return <div style={{ padding: '2rem' }}>Seleccione una empresa.</div>;

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
            <VisualHelpCard
                sectionId="liquidaciones"
                title="Gestión de Liquidaciones"
                onStartTour={() => setShowTour(true)}
                description="Acá es donde calculás cuánto tenés que pagarle a cada chofer por sus viajes. El sistema suma los fletes y te permite descontar adelantos o gastos."
                concepts={[
                    { term: "Lote de Pago", explanation: "Es el conjunto de viajes que le vas a pagar a un chofer en una sola vez." },
                    { term: "Deducción", explanation: "Es plata que le restás al chofer (ej: si le diste un adelanto en efectivo)." },
                    { term: "Neto Final", explanation: "Es la plata real que le tenés que transferir al chofer después de todos los descuentos." }
                ]}
                steps={[
                    "Elegí un chofer de la lista de la izquierda.",
                    "Marcá los viajes que ya están listos para pagar.",
                    "Si le diste plata antes, agregala en 'Deducciones'.",
                    "Tocá el botón azul 'CERRAR LOTE' y el sistema armará el recibo (PDF)."
                ]}
            />
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '2rem',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Truck color="#fbbf24" /> Gestión de Liquidaciones
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Control de ciclos de pago y batches para transportistas</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '12px' }}>
                        <button
                            onClick={() => setActiveTab('new')}
                            style={{
                                padding: '0.5rem 1.5rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                background: activeTab === 'new' ? 'var(--accent-blue)' : 'transparent',
                                color: activeTab === 'new' ? 'white' : 'rgba(255,255,255,0.6)',
                                fontWeight: activeTab === 'new' ? 800 : 500, fontSize: '0.8rem'
                            }}
                        >
                            NUEVA
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '0.5rem 1.5rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                background: activeTab === 'history' ? 'var(--accent-blue)' : 'transparent',
                                color: activeTab === 'history' ? 'white' : 'rgba(255,255,255,0.6)',
                                fontWeight: activeTab === 'history' ? 800 : 500, fontSize: '0.8rem'
                            }}
                        >
                            HISTORIAL
                        </button>
                    </div>
                    <button onClick={fetchData} className="btn-secondary" style={{ padding: '0.5rem' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1.2fr 2.8fr',
                    gap: '1.5rem'
                }}>
                    <div id="tour-settle-drivers" className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} /> Seleccionar Chofer
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {drivers.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => { setSelectedDriverId(d.id); setSelectedTripIds([]); }}
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        background: selectedDriverId === d.id ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ fontWeight: 800 }}>{d.nombre}</div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>DNI: {d.dni || 'N/A'} • Ciclo: {d.paymentCycle}</div>
                                    {selectedDriverId === d.id && <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}><Truck size={40} /></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {selectedDriverId ? (
                            <>
                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Período de {selectedDriver?.nombre}</h3>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ciclo de Pago: <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>{selectedDriver?.paymentCycle}</span></p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>SALDO A LIQUIDAR</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${pendingTrips.reduce((s, t) => s + Number(t.costAtExecution || 0), 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div id="tour-settle-trips" className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Viajes Pendientes de Cierre</h2>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{pendingTrips.length} viajes</div>
                                    </div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '500px' : 'auto' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                    <th style={{ padding: '0.5rem' }}>Sel.</th>
                                                    <th style={{ padding: '0.5rem' }}>CP</th>
                                                    <th style={{ padding: '0.5rem' }}>Fecha</th>
                                                    <th style={{ padding: '0.5rem' }}>Origen - Destino</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingTrips.map(t => (
                                                    <tr key={t.id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTripIds.includes(t.id)}
                                                                onChange={() => setSelectedTripIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                                                            />
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{t.numeroCP || 'S/N'}</td>
                                                        <td>{new Date(t.tsCreacion).toLocaleDateString()}</td>
                                                        <td style={{ fontSize: '0.7rem', opacity: 0.8 }}>{t.origenCiudad} → {t.destinoCiudad}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 800 }}>${Number(t.costAtExecution || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {pendingTrips.length === 0 && (
                                                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Sin viajes pendientes para el ciclo actual.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div id="tour-settle-deductions" className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Deducciones y Ajustes</h2>
                                        <button onClick={addDeduction} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                                            <Plus size={14} /> AGREGAR CONCEPTO
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {deductions.map((d: any, i: number) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                flexDirection: isMobile ? 'column' : 'row',
                                                gap: '0.5rem',
                                                alignItems: isMobile ? 'stretch' : 'center',
                                                padding: isMobile ? '1rem' : '0',
                                                background: isMobile ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                                    <select
                                                        value={d.tipo}
                                                        onChange={e => updateDeduction(i, 'tipo', e.target.value)}
                                                        className="glass-panel" style={{ padding: '0.4rem', border: 'none', color: 'white', background: '#1e293b', flex: 1 }}
                                                    >
                                                        <option value="ANTICIPO">Anticipo</option>
                                                        <option value="MULTA">Multa</option>
                                                        <option value="DANOS">Daños</option>
                                                        <option value="OTROS">Ajuste / Otros</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder="Monto $"
                                                        value={d.monto}
                                                        onChange={e => updateDeduction(i, 'monto', e.target.value)}
                                                        style={{ width: '100px', padding: '0.4rem', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '4px', color: 'white' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flex: 2 }}>
                                                    <input
                                                        placeholder="Descripción detallada"
                                                        value={d.descripcion}
                                                        onChange={e => updateDeduction(i, 'descripcion', e.target.value)}
                                                        style={{ flex: 1, padding: '0.4rem', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '4px', color: 'white' }}
                                                    />
                                                    <button onClick={() => removeDeduction(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.5rem' }}>
                                                        <Minus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div id="tour-settle-final" className="glass-panel" style={{
                                    padding: '1.5rem',
                                    background: 'var(--glass-accent)',
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    gap: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '2rem', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Bruto Seleccionado</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>${totalBruto.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Deducciones</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>-${totalDeducciones.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        textAlign: isMobile ? 'left' : 'right',
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        gap: '1rem',
                                        alignItems: isMobile ? 'stretch' : 'center'
                                    }}>
                                        <div style={{ marginRight: isMobile ? '0' : '1rem' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>NETO FINAL</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--success-green)', lineHeight: 1 }}>${netoFinal.toLocaleString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                disabled={selectedTripIds.length === 0}
                                                onClick={exportToCSV}
                                                className="btn-secondary"
                                                style={{ padding: '0.75rem', flex: 1, opacity: selectedTripIds.length === 0 ? 0.5 : 1 }}
                                                title="Exportar a CSV"
                                            >
                                                <Download size={20} />
                                            </button>
                                            <button
                                                disabled={selectedTripIds.length === 0}
                                                onClick={() => setShowConfirmModal(true)}
                                                className="btn-primary"
                                                style={{ padding: '0.75rem 2rem', flex: 3, fontWeight: 900, opacity: selectedTripIds.length === 0 ? 0.5 : 1 }}
                                            >
                                                CERRAR LOTE DE PAGO
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem', opacity: 0.7 }}>
                                    <h2 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', opacity: 0.5 }}>Histórico del Chofer (Últimos Viajes Pagados)</h2>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                            <tbody>
                                                {paidTrips.slice(0, 10).map(t => (
                                                    <tr key={t.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                        <td style={{ padding: '0.4rem' }}>{t.numeroCP || 'S/N'}</td>
                                                        <td>{new Date(t.tsCreacion).toLocaleDateString()}</td>
                                                        <td style={{ color: 'var(--success-green)', fontWeight: 700 }}>PAGADO</td>
                                                        <td style={{ textAlign: 'right' }}>${Number(t.costAtExecution || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {paidTrips.length === 0 && (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', opacity: 0.5 }}>No hay antecedentes de pago.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
                                <Truck size={64} style={{ marginBottom: '1rem' }} />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Seleccione un chofer para gestionar sus finanzas</h2>
                                <p>Podrá ver viajes pendientes, saldos históricos y generar nuevos lotes de pago.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <User size={18} opacity={0.5} />
                        <select
                            value={historyFilterDriverId}
                            onChange={e => setHistoryFilterDriverId(e.target.value)}
                            className="glass-panel"
                            style={{ background: '#1e293b', padding: '0.5rem', border: 'none', color: 'white', flex: 1 }}
                        >
                            <option value="">-- Todos los Choferes --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Mostrando {filteredHistory.length} lotes de pago</div>
                    </div>

                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '800px' : 'auto' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem' }}>ID Lote</th>
                                    <th style={{ padding: '1rem' }}>Chofer</th>
                                    <th style={{ padding: '1rem' }}><Calendar size={14} style={{ marginBottom: '-2px' }} /> Fecha Gen.</th>
                                    <th style={{ padding: '1rem' }}>Total Bruto</th>
                                    <th style={{ padding: '1rem' }}>Descuentos</th>
                                    <th style={{ padding: '1rem' }}>Neto Pagado</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map(l => (
                                    <tr key={l.id} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>#{l.id.split('-')[0]}</td>
                                        <td style={{ padding: '1rem' }}>{l.chofer?.nombre}</td>
                                        <td style={{ padding: '1rem' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>${Number(l.totalBruto).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: '#f87171' }}>-${Number(l.deduccionesTotal).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--success-green)' }}>${Number(l.netoFinal).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button onClick={() => handleDownload(l.id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                                                <FileText size={14} /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredHistory.length === 0 && (
                            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.5 }}>No se encontraron lotes para el filtro seleccionado.</div>
                        )}
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '550px', width: '90%', border: '1px solid var(--accent-blue)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--accent-blue)' }}>Confirmar Liquidación Final</h2>
                        <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Se emitirá un lote de pago para <strong>{selectedDriver?.nombre}</strong>.
                            Este proceso es irreversible y marcará los viajes como <strong>PAGADOS</strong>.
                        </p>
                        <div style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ opacity: 0.6 }}>Total en {selectedTripIds.length} viajes seleccionados</span>
                                <span style={{ fontWeight: 800 }}>${totalBruto.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', marginBottom: '1.25rem' }}>
                                <span style={{ opacity: 0.6 }}>Ajustes y Retenciones</span>
                                <span style={{ fontWeight: 800 }}>-${totalDeducciones.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 950, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                                <span>TOTAL A PAGAR</span>
                                <span style={{ color: 'var(--success-green)' }}>${netoFinal.toLocaleString()}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowConfirmModal(false)} className="btn-secondary" style={{ flex: 1, fontWeight: 700 }}>REVISAR</button>
                            <button onClick={handleConfirmSettlement} className="btn-primary" style={{ flex: 2, fontWeight: 900, fontSize: '1rem' }}>CONFIRMAR Y EMITIR</button>
                        </div>
                    </div>
                </div>
            )}
            {showTour && (
                <VisualTourOverlay
                    onClose={() => setShowTour(false)}
                    steps={[
                        {
                            elementId: 'liquidaciones',
                            title: 'Pago a Choferes',
                            content: '¡Bienvenido! En esta sección vas a calcular cuánto dinero corresponde pagarle a cada chofer por su trabajo.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-settle-drivers',
                            title: 'Paso 1: ¿A quién le pagamos?',
                            content: 'Primero elegí al chofer de la lista. Vas a ver su nombre, DNI y cada cuánto tiempo le solés pagar (Ciclo de Pago).',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-settle-trips',
                            title: 'Paso 2: Detalle de Viajes',
                            content: 'Aquí ves: \n• CP: El número de Carta de Porte. \n• Fecha: Cuándo se hizo el viaje. \n• Origen/Destino: De dónde a dónde fue. \n• Monto: Lo que se le paga al chofer por ese flete específico.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-settle-deductions',
                            title: 'Paso 3: Deducciones (Descuentos)',
                            content: 'Si el chofer te debe plata: \n• Anticipos: Dinero que le diste antes. \n• Multas/Daños: Si hubo un problema en el viaje. \nEl monto que pongas acá se RESTARÁ del total automáticamente.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-settle-final',
                            title: 'Paso 4: ¡Todo listo!',
                            content: 'Este es el "Neto Final". Es la plata "en mano" que debe recibir el chofer. Al tocar el botón azul, generás el recibo PDF.',
                            position: 'left'
                        }
                    ]}
                />
            )}
        </div>
    );
}
