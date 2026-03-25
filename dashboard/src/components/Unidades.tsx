import { Truck, Plus, Edit2, FileUp, Download, X, Search, Shield, Gauge, Save, ArrowRight, History } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNotification } from '../App';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Unidades({ tenantId }: { tenantId: string | null }) {
    const { notify } = useNotification();
    const [unidades, setUnidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState(tenantId || '');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showHistory, setShowHistory] = useState<any | null>(null);
    const [unitTrips, setUnitTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI state
    const [formTab, setFormTab] = useState<'info' | 'vencimientos'>('info');

    const [newUnit, setNewUnit] = useState<any>({
        patente: '',
        marca: '',
        modelo: '',
        vencimientoVTV: '',
        vencimientoSeguro: '',
        vencimientoRuta: '',
        kmInicial: 0,
        odometroActual: 0
    });

    const downloadSample = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/management/units/sample`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_unidades.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            notify('No se pudo descargar la plantilla', 'error');
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/management/tenants`);
            setTenants(res.data);
            if (res.data.length > 0 && !selectedTenant) {
                setSelectedTenant(res.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching tenants', err);
        }
    };

    const fetchUnidades = async (id: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/units?tenantId=${id || ''}`);
            setUnidades(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            notify('Error al cargar unidades', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnitHistory = async (unitId: string) => {
        try {
            setLoadingTrips(true);
            const res = await axios.get(`${API_BASE_URL}/management/trips?unidadId=${unitId}`);
            setUnitTrips(res.data.filter((t: any) => t.estado === 'FINALIZADO'));
        } catch (err) {
            notify('Error al cargar historial de km', 'error');
        } finally {
            setLoadingTrips(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchUnidades(selectedTenant);
    }, [selectedTenant]);

    useEffect(() => {
        if (showHistory) {
            fetchUnitHistory(showHistory.id);
        } else {
            setUnitTrips([]);
        }
    }, [showHistory]);

    const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTenant) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        setImportResult(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/units/bulk-import?tenantId=${selectedTenant}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setImportResult(res.data);
            notify(`Importación finalizada: ${res.data.success} éxitos`, 'success');
            fetchUnidades(selectedTenant);
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error en la importación', 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!newUnit.patente) {
            notify('La patente es obligatoria', 'error');
            return;
        }

        try {
            const unitData = {
                ...newUnit,
                kmInicial: Number(newUnit.kmInicial || 0),
                odometroActual: Number(newUnit.odometroActual || newUnit.kmInicial || 0)
            };

            if (isEditing && selectedUnitId) {
                await axios.patch(`${API_BASE_URL}/units/${selectedUnitId}`, unitData);
                notify('Unidad actualizada', 'success');
            } else {
                await axios.post(`${API_BASE_URL}/units`, { ...unitData, tenantId: selectedTenant });
                notify('Nueva unidad registrada', 'success');
            }
            setShowModal(false);
            setIsEditing(false);
            setSelectedUnitId(null);
            fetchUnidades(selectedTenant);
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error al guardar unidad', 'error');
        }
    };

    const openEditModal = (unit: any) => {
        setNewUnit({
            patente: unit.patente,
            marca: unit.marca || '',
            modelo: unit.modelo || '',
            vencimientoVTV: unit.vencimientoVTV || '',
            vencimientoSeguro: unit.vencimientoSeguro || '',
            vencimientoRuta: unit.vencimientoRuta || '',
            kmInicial: unit.kmInicial || 0,
            odometroActual: unit.odometroActual || 0
        });
        setSelectedUnitId(unit.id);
        setIsEditing(true);
        setFormTab('info');
        setShowModal(true);
    };

    const openCreateModal = () => {
        setNewUnit({
            patente: '',
            marca: '',
            modelo: '',
            vencimientoVTV: '',
            vencimientoSeguro: '',
            vencimientoRuta: '',
            kmInicial: 0,
            odometroActual: 0
        });
        setIsEditing(false);
        setSelectedUnitId(null);
        setFormTab('info');
        setShowModal(true);
    };

    const filteredUnits = unidades.filter(u =>
        u.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('es-AR');
        } catch {
            return dateStr;
        }
    };

    const isExpired = (dateStr: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <style>{`
                .list-header, .unit-row {
                    display: grid;
                    grid-template-columns: 1.5fr 2fr 2fr 1.5fr 1.5fr;
                    gap: 1rem;
                    align-items: center;
                }

                @media (max-width: 1024px) {
                    .list-header { display: none !important; }
                    .unit-row {
                        display: flex !important;
                        flex-direction: column;
                        align-items: stretch !important;
                        padding: 1.5rem !important;
                        gap: 1rem !important;
                        border-radius: 20px !important;
                    }
                    .mobile-id { order: 1; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
                    .mobile-data { order: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                    .mobile-km { order: 3; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 12px; }
                    .mobile-actions { order: 4; display: flex; gap: 0.5rem; }
                    .btn-command { flex: 1; justify-content: center !important; }
                }

                .btn-command {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; 
                    border-radius: 12px; cursor: pointer; border: none; transition: all 0.2s;
                    font-size: 0.8rem; font-weight: 700; color: white; white-space: nowrap;
                }
                .btn-command:hover { transform: translateY(-2px); filter: brightness(1.2); }
                .glass-panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.05); }
                
                .form-tab-btn {
                    flex: 1; padding: 1rem; background: none; border: none; color: white; 
                    font-weight: 800; font-size: 0.7rem; letter-spacing: 0.05em; cursor: pointer; 
                    transition: all 0.3s; opacity: 0.4; border-bottom: 2px solid transparent;
                }
                .form-tab-btn.active { opacity: 1; color: #818cf8; border-bottom: 2px solid #818cf8; background: rgba(129, 140, 248, 0.05); }

                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(12px); z-index: 1100; 
                    display: flex; justify-content: center; align-items: flex-start; 
                    padding: 2rem 1rem; overflow-y: auto;
                }
            `}</style>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '0.75rem', borderRadius: '16px' }}>
                            <Truck size={32} color="white" />
                        </div>
                        Unidades
                    </h1>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '850px' }}>
                    <div className="glass-panel" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', borderRadius: '14px' }}>
                        <Search size={20} style={{ opacity: 0.4, marginRight: '0.75rem' }} />
                        <input type="text" placeholder="Buscar por patente, marca o modelo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>
                    {!tenantId && (
                        <select value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)} className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', color: 'white', outline: 'none' }}>
                            {tenants.map(t => <option key={t.id} value={t.id} style={{ background: '#1e293b' }}>{t.nombreEmpresa}</option>)}
                        </select>
                    )}
                    <button onClick={() => setShowImportWizard(true)} className="btn-secondary" style={{ padding: '1rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileUp size={20} /> Importar
                    </button>
                    <button onClick={openCreateModal} className="btn-primary" style={{ padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: 800 }}>
                        <Plus size={22} /> Nueva Unidad
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5, letterSpacing: '0.2em' }}>CARGANDO...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="list-header" style={{ padding: '0 1.5rem', opacity: 0.4, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <div>Identidad</div>
                        <div>Marca / Modelo</div>
                        <div>Documentación</div>
                        <div>Kilometraje</div>
                        <div style={{ textAlign: 'right' }}></div>
                    </div>

                    {filteredUnits.map(u => (
                        <div key={u.id} className="glass-panel unit-row" style={{ padding: '0.75rem 1.5rem', borderRadius: '16px' }}>
                            <div className="mobile-id" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 900, color: 'white', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {u.patente}
                                </div>
                            </div>

                            <div className="mobile-data">
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.marca || '-'}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{u.modelo || 'Sin modelo'}</div>
                            </div>

                            <div className="mobile-data" style={{ fontSize: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '8px', color: isExpired(u.vencimientoVTV) ? '#f87171' : 'inherit' }}>
                                    <span style={{ opacity: 0.5, fontWeight: 800 }}>VTV:</span> {formatDate(u.vencimientoVTV)}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ opacity: 0.5, fontWeight: 800 }}>SEG:</span> {formatDate(u.vencimientoSeguro)}
                                </div>
                            </div>

                            <div className="mobile-km" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5 }}>ACTUAL</span>
                                    <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '0.9rem' }}>{u.odometroActual?.toLocaleString()} km</div>
                                </div>
                                <button onClick={() => setShowHistory(u)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.3, cursor: 'pointer' }} title="Ver historial">
                                    <History size={16} />
                                </button>
                            </div>

                            <div className="mobile-actions" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button onClick={() => openEditModal(u)} className="btn-command" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <Edit2 size={14} /> Ficha
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative', borderRadius: '32px' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>
                                <Truck size={32} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{isEditing ? 'Editar Unidad' : 'Nueva Unidad'}</h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>{isEditing ? `Modificando unidad ${newUnit.patente}` : 'Registre un nuevo vehículo en la flota'}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative', marginBottom: '1rem' }}>
                                <div style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', width: formTab === 'info' ? '50%' : '100%', transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', overflow: 'hidden' }}>
                                <button type="button" onClick={() => setFormTab('info')} className={`form-tab-btn ${formTab === 'info' ? 'active' : ''}`}>01. INFORMACIÓN BASE</button>
                                <button type="button" onClick={() => setFormTab('vencimientos')} className={`form-tab-btn ${formTab === 'vencimientos' ? 'active' : ''}`}>02. VENCIMIENTOS</button>
                            </div>
                        </div>

                        <div>
                            {formTab === 'info' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Patente / Dominio</label>
                                        <input type="text" required value={newUnit.patente || ''} onChange={e => setNewUnit({ ...newUnit, patente: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="ABC-123" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Marca</label>
                                            <input type="text" value={newUnit.marca || ''} onChange={e => setNewUnit({ ...newUnit, marca: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="Ej: Mercedes-Benz" />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Modelo</label>
                                            <input type="text" value={newUnit.modelo || ''} onChange={e => setNewUnit({ ...newUnit, modelo: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="Ej: Axor 2035" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                <Gauge size={14} color="#3b82f6" /> Km Inicial
                                            </label>
                                            <input type="number" value={newUnit.kmInicial || 0} onChange={e => setNewUnit({ ...newUnit, kmInicial: Number(e.target.value) })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Odómetro Actual</label>
                                            <input type="number" value={newUnit.odometroActual || 0} onChange={e => setNewUnit({ ...newUnit, odometroActual: Number(e.target.value) })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                <Shield size={14} color="#3b82f6" /> Vencimiento VTV
                                            </label>
                                            <input type="date" value={newUnit.vencimientoVTV || ''} onChange={e => setNewUnit({ ...newUnit, vencimientoVTV: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Vencimiento Seguro</label>
                                            <input type="date" value={newUnit.vencimientoSeguro || ''} onChange={e => setNewUnit({ ...newUnit, vencimientoSeguro: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Vencimiento Ruta / CNRT</label>
                                        <input type="date" value={newUnit.vencimientoRuta || ''} onChange={e => setNewUnit({ ...newUnit, vencimientoRuta: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>CANCELAR</button>
                            {formTab === 'info' ? (
                                <button type="button" onClick={() => setFormTab('vencimientos')} className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    SIGUIENTE PASO <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button type="button" onClick={handleCreateOrUpdate} className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 900, background: 'var(--success-green)', color: 'black' }}>
                                    <Save size={20} /> {isEditing ? 'GUARDAR CAMBIOS' : 'CONFIRMAR ALTA'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="modal-overlay">
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative', borderRadius: '32px' }}>
                        <button onClick={() => setShowHistory(null)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <History color="#3b82f6" /> Historial de Km
                        </h2>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Kilometraje Inicial</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{showHistory.kmInicial?.toLocaleString() || 0} km</div>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Actualizaciones por Viajes</div>

                            {loadingTrips ? (
                                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Cargando viajes...</div>
                            ) : unitTrips.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {unitTrips.map((t: any) => (
                                        <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>CP {t.numeroCP}</span>
                                                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(t.tsFinalizacionReal || t.tsCierre).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{t.origenNombre} → {t.destinoNombre}</div>
                                                <div style={{ fontWeight: 800, color: '#4ade80' }}>+{t.distanciaTotalRecorridaKm} km</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.3, fontSize: '0.8rem' }}>No hay registros de viajes finalizados para esta unidad.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showImportWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div className="glass-panel" style={{ width: '550px', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <FileUp size={30} color="var(--accent-blue)" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Asistente de Importación</h2>
                            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Siga estos pasos para cargar su lista de unidades rápidamente.</p>
                        </div>

                        {!importResult ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <button onClick={downloadSample} className="btn-secondary" style={{ padding: '1rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Download size={18} /> 1. Descargar Plantilla .CSV
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleBulkImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 800 }}>
                                    {isImporting ? 'PROCESANDO...' : '2. Seleccionar y Cargar Archivo'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-green)' }}>{importResult.success} Unidades Creadas</h3>
                                </div>
                                <button onClick={() => setShowImportWizard(false)} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontWeight: 800 }}>Finalizar</button>
                            </div>
                        )}
                        {!importResult && !isImporting && (
                            <button onClick={() => setShowImportWizard(false)} style={{ width: '100%', marginTop: '1.5rem', background: 'none', border: 'none', color: 'white', opacity: 0.4, cursor: 'pointer', fontSize: '0.85rem' }}>Cerrar Asistente</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
