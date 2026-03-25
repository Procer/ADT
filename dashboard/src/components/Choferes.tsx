import { User, Phone, AlertCircle, Edit2, FileUp, Download, TrendingUp, BadgeDollarSign, Search, Plus, X, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PricingManager from './PricingManager';
import { useNotification } from '../App';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Choferes({ tenantId }: { tenantId: string | null }) {
    const { notify } = useNotification();
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [_tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState(tenantId || '');
    const [isImporting, setIsImporting] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [_importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
    const [showPricing, setShowPricing] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI state
    const [formTab, setFormTab] = useState<'personal' | 'licencia'>('personal');

    const downloadSample = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/management/drivers/sample`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_choferes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            notify('No se pudo descargar la plantilla', 'error');
        }
    };

    const initialForm = {
        nombre: '',
        dni: '',
        email: '',
        telefono: '',
        telegramUser: '',
        telegramChatId: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        fechaNacimiento: '',
        licenciaNumero: '',
        licenciaCategoria: '',
        art: '',
        vencimientoLicencia: '',
        pin: '',
        telefonoEmergencia: '',
        paymentCycle: 'SEMANAL'
    };
    const [newDriver, setNewDriver] = useState(initialForm);

    useEffect(() => {
        if (tenantId) setSelectedTenant(tenantId);
    }, [tenantId]);

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

    const fetchDrivers = async (id: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/management/drivers?tenantId=${id || ''}`);
            setDrivers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            notify('Error al cargar la lista de choferes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        fetchDrivers(selectedTenant);
    }, [selectedTenant]);

    const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTenant) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        setImportResult(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/drivers/bulk-import?tenantId=${selectedTenant}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setImportResult(res.data);
            notify(`Importación finalizada: ${res.data.success} éxitos`, 'success');
            fetchDrivers(selectedTenant);
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error en la importación', 'error');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalPin = newDriver.pin;
        if (!finalPin && newDriver.dni) {
            finalPin = newDriver.dni.slice(-4);
        }

        try {
            if (isEditing && selectedDriverId) {
                await axios.patch(`${API_BASE_URL}/drivers/${selectedDriverId}`, {
                    ...newDriver,
                    pin: finalPin || '1234'
                });
                notify('Ficha de chofer actualizada', 'success');
            } else {
                await axios.post(`${API_BASE_URL}/drivers`, {
                    ...newDriver,
                    pin: finalPin || '1234',
                    tenantId: selectedTenant
                });
                notify('Nuevo chofer registrado con éxito', 'success');
            }
            setShowModal(false);
            setNewDriver(initialForm);
            setIsEditing(false);
            setSelectedDriverId(null);
            fetchDrivers(selectedTenant);
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error al guardar chofer', 'error');
        }
    };

    const openEditModal = (driver: any) => {
        setNewDriver({
            nombre: driver.nombre,
            dni: driver.dni || '',
            email: driver.email || '',
            telefono: driver.telefono || '',
            telegramUser: driver.telegramUser || '',
            telegramChatId: driver.telegramChatId || '',
            fechaIngreso: driver.fechaIngreso || new Date().toISOString().split('T')[0],
            fechaNacimiento: driver.fechaNacimiento || '',
            licenciaNumero: driver.licenciaNumero || '',
            licenciaCategoria: driver.licenciaCategoria || '',
            art: driver.art || '',
            vencimientoLicencia: driver.vencimientoLicencia || '',
            pin: driver.pin || '',
            telefonoEmergencia: driver.telefonoEmergencia || '',
            paymentCycle: driver.paymentCycle || 'SEMANAL'
        });
        setSelectedDriverId(driver.id);
        setIsEditing(true);
        setFormTab('personal');
        setShowModal(true);
    };

    const openCreateModal = () => {
        setNewDriver(initialForm);
        setIsEditing(false);
        setSelectedDriverId(null);
        setFormTab('personal');
        setShowModal(true);
    };

    const filteredDrivers = drivers.filter(d =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.dni?.includes(searchTerm)
    );

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'S/D') return '-';
        try {
            const datePart = dateStr.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length !== 3) return dateStr;
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        } catch (err) {
            return dateStr;
        }
    };

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <style>{`
                .list-header, .driver-row {
                    display: grid;
                    grid-template-columns: 1.8fr 1.2fr 1.2fr 1.2fr 1fr 1.5fr;
                    gap: 1rem;
                    align-items: center;
                }

                .compact-data { display: flex; flex-direction: column; gap: 2px; }
                .horizontal-data { display: flex; align-items: center; gap: 10px; }
                .action-panel { display: flex; justify-content: flex-end; align-items: center; }
                .action-subgroup { display: flex; align-items: center; gap: 0.65rem; white-space: nowrap; }

                @media (max-width: 1024px) {
                    .list-header { display: none !important; }
                    .driver-row {
                        display: flex !important;
                        flex-direction: column;
                        align-items: stretch !important;
                        padding: 1.5rem !important;
                        gap: 0.75rem !important;
                        border-radius: 20px !important;
                    }
                    
                    .mobile-id { order: 1; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
                    .mobile-contact { order: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 0.25rem 0; }
                    .mobile-dates { order: 3; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.5rem; }
                    .mobile-license { order: 4; font-size: 0.85rem; opacity: 0.8; }
                    .mobile-price { order: 5; background: rgba(255,255,255,0.02); padding: 0.5rem 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); }
                    .mobile-actions { order: 6; margin-top: 0.5rem; }

                    .action-panel { flex-direction: row !important; gap: 0.5rem !important; background: none !important; border: none !important; padding: 0 !important; }
                    .action-subgroup { width: 100%; display: flex !important; flex-direction: row !important; gap: 0.5rem !important; }
                    .btn-command { flex: 1; justify-content: center !important; height: 48px; font-size: 0.85rem; }
                }

                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(12px); z-index: 1100; 
                    display: flex; justify-content: center; align-items: flex-start; 
                    padding: 2rem 1rem; overflow-y: auto;
                }
                .modal-content-pro {
                    width: 100%; maxWidth: 600px; background: rgba(30, 41, 59, 0.7);
                    padding: 2.5rem; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative; margin-bottom: 2rem;
                }

                .btn-command {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.1rem; 
                    border-radius: 12px; cursor: pointer; border: none; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 0.8rem; font-weight: 700; color: white; white-space: nowrap;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .btn-command:hover { transform: translateY(-2px); filter: brightness(1.15); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); }
                .btn-command:active { transform: translateY(0); }

                .btn-ficha { background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.1); }
                .btn-tarifas { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }

                .glass-panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.05); }
                
                .form-tab-btn {
                    flex: 1; padding: 1.25rem; background: none; border: none; color: white; 
                    font-weight: 800; font-size: 0.75rem; letter-spacing: 0.05em; cursor: pointer; 
                    transition: all 0.3s; opacity: 0.4; border-bottom: 2px solid transparent;
                }
                .form-tab-btn.active { opacity: 1; color: #818cf8; border-bottom: 2px solid #818cf8; background: rgba(129, 140, 248, 0.05); }
            `}</style>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), #6366f1)', padding: '0.75rem', borderRadius: '16px', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)' }}>
                            <User size={32} color="white" />
                        </div>
                        Choferes
                    </h1>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '800px' }}>
                    <div className="glass-panel" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', borderRadius: '14px' }}>
                        <Search size={20} style={{ opacity: 0.4, marginRight: '0.75rem' }} />
                        <input type="text" placeholder="Buscar chofer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>
                    <button onClick={openCreateModal} className="btn-primary" style={{ padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                        <Plus size={22} /> Nuevo Chofer
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5, fontSize: '0.8rem', letterSpacing: '0.2em' }}>CARGANDO...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="list-header" style={{ padding: '0 1.5rem', opacity: 0.4, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <div>Identidad (DNI/PIN)</div>
                        <div>Contacto (PER/SOS)</div>
                        <div>Fechas (NAC/ING)</div>
                        <div>Licencia</div>
                        <div>Tarifa</div>
                        <div style={{ textAlign: 'right' }}>Acciones</div>
                    </div>

                    {filteredDrivers.map(d => (
                        <div key={d.id} className="glass-panel driver-row" style={{ padding: '0.75rem 1.5rem', borderRadius: '16px' }}>
                            <div className="mobile-id" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', fontWeight: 900, color: 'white' }}>
                                    {d.nombre.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="compact-data">
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{d.nombre}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                        DNI: <span style={{ color: 'white' }}>{d.dni || '-'}</span> •
                                        PIN: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{d.pin || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mobile-contact compact-data">
                                <div style={{ fontSize: '0.8rem' }}><span style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800 }}>PER:</span> {d.telefono || '-'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}><span style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800 }}>SOS:</span> {d.telefonoEmergencia || '-'}</div>
                            </div>

                            <div className="mobile-dates compact-data" style={{ fontSize: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <span style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800 }}>NAC:</span>
                                    <span>{formatDate(d.fechaNacimiento)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', opacity: 0.6 }}>
                                    <span style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800 }}>ING:</span>
                                    <span>{formatDate(d.fechaIngreso)}</span>
                                </div>
                            </div>

                            <div className="mobile-license compact-data">
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.licenciaNumero || 'S/L'}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Cat: {d.licenciaCategoria || '-'}</div>
                            </div>

                            <div className="mobile-price compact-data">
                                <span style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800 }}>TARIFA:</span>
                                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem' }}>
                                    ${Number(d.precioPorViaje || 0).toLocaleString('es-AR')}
                                </div>
                            </div>

                            <div className="action-panel mobile-actions">
                                <div className="action-subgroup" style={{ justifyContent: 'flex-end' }}>
                                    <button onClick={() => openEditModal(d)} className="btn-command btn-ficha">
                                        <Edit2 size={14} /> Ficha
                                    </button>
                                    <button onClick={() => setShowPricing({ id: d.id, name: d.nombre })} className="btn-command btn-tarifas">
                                        <TrendingUp size={14} /> Tarifas
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content" style={{ width: '600px', padding: '2.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)' }}>
                                {(newDriver.nombre || '??').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                                    {isEditing ? 'Actualizar Legajo' : 'Alta de Chofer'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>{isEditing ? `Modificando perfil de ${newDriver.nombre}` : 'Complete los datos del nuevo integrante'}</p>
                            </div>
                        </div>

                        {/* Barra de Progreso y Tabs */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', position: 'relative', marginBottom: '1rem' }}>
                                <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', width: formTab === 'personal' ? '50%' : '100%', transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', overflow: 'hidden' }}>
                                <button type="button" onClick={(e) => { e.preventDefault(); setFormTab('personal'); }} className={`form-tab-btn ${formTab === 'personal' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', fontSize: '0.7rem' }}>
                                    01. DATOS PERSONALES
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); setFormTab('licencia'); }} className={`form-tab-btn ${formTab === 'licencia' ? 'active' : ''}`} style={{ flex: 1, padding: '1rem', fontSize: '0.7rem' }}>
                                    02. LICENCIA Y SEGURIDAD
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '0' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                {formTab === 'personal' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <User size={14} color="#818cf8" /> Nombre Completo
                                                </label>
                                                <input type="text" required placeholder="Ej: Juan Pérez" value={newDriver.nombre || ''} onChange={e => setNewDriver({ ...newDriver, nombre: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <BadgeDollarSign size={14} color="#818cf8" /> DNI (Acceso)
                                                </label>
                                                <input type="text" required placeholder="Solo números" value={newDriver.dni || ''} onChange={e => setNewDriver({ ...newDriver, dni: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <Phone size={14} color="#818cf8" /> Teléfono
                                                </label>
                                                <input type="tel" placeholder="+54 9..." value={newDriver.telefono || ''} onChange={e => setNewDriver({ ...newDriver, telefono: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <AlertCircle size={14} /> SOS
                                                </label>
                                                <input type="tel" placeholder="Urgencias" value={newDriver.telefonoEmergencia || ''} onChange={e => setNewDriver({ ...newDriver, telefonoEmergencia: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <TrendingUp size={14} color="#818cf8" /> Nacimiento
                                                </label>
                                                <input type="date" value={newDriver.fechaNacimiento || ''} onChange={e => setNewDriver({ ...newDriver, fechaNacimiento: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    PIN
                                                </label>
                                                <input type="text" maxLength={4} value={newDriver.pin || ''} onChange={e => setNewDriver({ ...newDriver, pin: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(251, 191, 36, 0.03)', border: '1px solid rgba(251, 191, 36, 0.15)', color: '#fbbf24', borderRadius: '12px', textAlign: 'center', fontWeight: '900', fontSize: '1rem', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Periodicidad de Cobro
                                            </label>
                                            <select
                                                value={newDriver.paymentCycle || 'SEMANAL'}
                                                onChange={e => setNewDriver({ ...newDriver, paymentCycle: e.target.value })}
                                                className="glass-panel"
                                                style={{ width: '100%', padding: '0.85rem', background: '#1e293b', border: 'none', color: 'white', borderRadius: '12px', outline: 'none' }}
                                            >
                                                <option value="DIARIO">DIARIO</option>
                                                <option value="SEMANAL">SEMANAL</option>
                                                <option value="QUINCENAL">QUINCENAL</option>
                                                <option value="MENSUAL">MENSUAL</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    <Download size={14} color="#818cf8" /> Nro. Licencia
                                                </label>
                                                <input type="text" placeholder="Ej: L-34000" value={newDriver.licenciaNumero || ''} onChange={e => setNewDriver({ ...newDriver, licenciaNumero: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    Categoría
                                                </label>
                                                <input type="text" placeholder="E1, B2..." value={newDriver.licenciaCategoria || ''} onChange={e => setNewDriver({ ...newDriver, licenciaCategoria: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    Vencimiento
                                                </label>
                                                <input type="date" value={newDriver.vencimientoLicencia || ''} onChange={e => setNewDriver({ ...newDriver, vencimientoLicencia: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    ART
                                                </label>
                                                <input type="text" placeholder="Aseguradora" value={newDriver.art || ''} onChange={e => setNewDriver({ ...newDriver, art: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Fecha de Ingreso
                                            </label>
                                            <input type="date" value={newDriver.fechaIngreso || ''} onChange={e => setNewDriver({ ...newDriver, fechaIngreso: e.target.value })} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', outline: 'none', colorScheme: 'dark' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>CANCELAR</button>

                                {formTab === 'personal' ? (
                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormTab('licencia'); }} className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        SIGUIENTE PASO <ArrowRight size={20} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleCreateOrUpdate} className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 900, background: 'var(--success-green)', color: 'black' }}>
                                        {isEditing ? 'GUARDAR CAMBIOS' : 'CONFIRMAR ALTA'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showImportWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '3rem', borderRadius: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <FileUp size={32} color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Carga Masiva</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button onClick={downloadSample} className="btn-secondary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>1. Descargar Plantilla</button>
                            <input type="file" ref={fileInputRef} onChange={handleBulkImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 800 }}>
                                {isImporting ? 'PROCESANDO...' : '2. Cargar Excel'}
                            </button>
                            <button onClick={() => setShowImportWizard(false)} className="btn-secondary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', opacity: 0.5 }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {showPricing && <PricingManager tenantId={selectedTenant} entityId={showPricing.id} entityName={showPricing.name} entityType="CHOFER" onClose={() => { setShowPricing(null); fetchDrivers(selectedTenant); }} />}
        </div>
    );
}
