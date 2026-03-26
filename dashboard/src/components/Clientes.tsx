import { API_BASE_URL } from '../config';
import { Building2, Plus, ExternalLink, Mail, LayoutList, Search, UserCheck, RefreshCw, Edit2, Trash2, Save, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../App';



export default function Clientes({ onImpersonate }: { onImpersonate: (id: string) => void }) {
    const { notify } = useNotification();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [userRole] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
            return user.role || '';
        } catch { return ''; }
    });

    const [newClient, setNewClient] = useState({
        nombreEmpresa: '',
        adminEmail: '',
        adminPassword: '',
        adminName: '',
        logoUrl: '',
        telegramChatId: '',
        config: { geocerca_mts: 500, moneda: 'ARS', frecuencia_gps_seg: 120 },
        precioUnidad: 150
    });

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/tenants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenants(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            notify('Error al cargar las empresas del ecosistema', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants`, {
                ...newClient,
                config: {
                    ...newClient.config,
                    geocerca_mts: Number(newClient.config.geocerca_mts)
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setNewClient({
                nombreEmpresa: '',
                adminEmail: '',
                adminPassword: '',
                adminName: '',
                logoUrl: '',
                telegramChatId: '',
                config: { geocerca_mts: 500 as any, moneda: 'ARS', frecuencia_gps_seg: 120 },
                precioUnidad: 150
            });
            notify('Empresa creada exitosamente', 'success');
            fetchTenants();
        } catch (err) {
            notify('Error al crear la empresa', 'error');
        }
    };

    const [editClient, setEditClient] = useState<any>(null);
    const [adminInfo, setAdminInfo] = useState<any>(null);
    const [resetResult, setResetResult] = useState<any>(null);
    const [confirmReset, setConfirmReset] = useState<any>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            nombreEmpresa: editClient.nombreEmpresa,
            logoUrl: editClient.logoUrl,
            telegramChatId: editClient.telegramChatId,
            precioUnidad: Number(editClient.precioUnidad),
            config: {
                ...(editClient.config || {}),
                geocerca_mts: editClient.config?.geocerca_mts === '' ? 0 : Number(editClient.config?.geocerca_mts ?? 0)
            }
        };

        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${editClient.id}/update`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Configuración actualizada correctamente', 'success');
            setEditClient(null);
            fetchTenants();
        } catch (err: any) {
            notify('Error al actualizar los parámetros de la empresa', 'error');
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${id}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Estado SaaS actualizado', 'info');
            fetchTenants();
        } catch (err) {
            notify('Error al cambiar el estado de la empresa', 'error');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción es IRREVERSIBLE y borrará TODOS los datos de ${name}.`)) return;

        const secret = prompt('Escribe "ADT_CONFIRM_DELETE" para confirmar el borrado total:');
        if (secret !== 'ADT_CONFIRM_DELETE') {
            notify('Código de confirmación incorrecto', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${id}/delete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Empresa eliminada permanentemente del ecosistema', 'success', 'Borrado Total');
            fetchTenants();
        } catch (err) {
            notify('Error crítico al eliminar la empresa', 'error');
        }
    };

    const handleResetPassword = async () => {
        const { tenantId, empresa } = confirmReset;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/management/tenants/${tenantId}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResetResult({ ...res.data, empresa });
            setConfirmReset(null);
            notify('Contraseña restablecida con éxito', 'success');
        } catch (err: any) {
            notify('Error al resetear la contraseña del administrador', 'error');
        }
    };

    const handleShowAdminInfo = async (tenantId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/tenants/${tenantId}/admin-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdminInfo({ ...res.data, tenantId });
        } catch (err: any) {
            notify('No se pudo obtener la información del administrador', 'error');
        }
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${adminInfo.tenantId}/admin-update`, {
                nombre: adminInfo.nombre,
                email: adminInfo.email
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Datos del administrador actualizados', 'success');
            setAdminInfo(null);
            fetchTenants();
        } catch (err: any) {
            notify('Error al actualizar el administrador', 'error');
        }
    };

    const handleSendCredentials = async (tenantId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/management/tenants/${tenantId}/send-credentials`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(res.data.message, 'success', 'Correo Enviado');
        } catch (err: any) {
            notify('Error al enviar las credenciales por correo', 'error');
        }
    };

    const clearTableData = async (tenantId: string, name: string) => {
        if (!window.confirm(`¿Vaciar todos los viajes y logs de ${name}?`)) return;
        const secret = prompt('Escribe "ADT_CONFIRM_DELETE" para confirmar la limpieza de datos:');
        if (secret !== 'ADT_CONFIRM_DELETE') {
            notify('Código incorrecto', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/cleanup`, {
                tenantId,
                secret: 'ADT_CONFIRM_DELETE'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(`Se han limpiado los datos operativos de ${name}`, 'success');
            fetchTenants();
        } catch (err) {
            notify('Error al vaciar los datos', 'error');
        }
    }

    const filteredTenants = tenants.filter(t =>
        t.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: tenants.length,
        active: tenants.filter(t => t.activo).length
    };

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <style>{`
                .tooltip-container { position: relative; display: inline-block; }
                .tooltip-text {
                    visibility: hidden; width: 180px; background: #0f172a; color: #fff; text-align: center;
                    border-radius: 8px; padding: 8px; position: absolute; z-index: 100; bottom: 125%; left: 50%;
                    margin-left: -90px; opacity: 0; transition: opacity 0.3s; font-size: 0.7rem;
                    border: 1px solid rgba(255,255,255,0.1); pointer-events: none; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
                }
                .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }

                /* GRID ESTRUCTURAL PRO */
                .list-header, .client-row {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 4fr;
                    gap: 1.5rem;
                    align-items: center;
                }

                @media (max-width: 1440px) {
                    .list-header, .client-row { grid-template-columns: 1.2fr 0.8fr 5fr; }
                }

                /* RESPONSIVIDAD MOVIL */
                @media (max-width: 1024px) {
                    .list-header { display: none !important; }
                    .client-row {
                        display: flex !important;
                        flex-direction: column;
                        align-items: stretch !important;
                        padding: 1.5rem !important;
                        gap: 1rem !important;
                    }
                    .status-col { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
                    .status-col::before { content: "ESTADO SAAS:"; font-weight: 800; opacity: 0.5; font-size: 0.75rem; letter-spacing: 0.05em; }
                    .action-panel { 
                        flex-direction: column !important; 
                        gap: 0.5rem !important; 
                        background: none !important; 
                        border: none !important; 
                        padding: 0 !important; 
                    }
                    .action-subgroup { 
                        width: 100%; 
                        display: flex !important; 
                        flex-direction: row !important; 
                        gap: 0.5rem !important; 
                    }
                    .action-subgroup > .tooltip-container { flex: 1; }
                    .btn-command { 
                        width: 100%; 
                        justify-content: center !important; 
                        padding: 0.85rem !important; 
                        font-size: 0.85rem !important;
                    }
                    .separator { display: none !important; }
                    .tooltip-text { display: none !important; }
                }

                .btn-command {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; 
                    border-radius: 10px; cursor: pointer; border: none; transition: all 0.2s;
                    font-size: 0.75rem; font-weight: 700; color: white; white-space: nowrap;
                }
                .btn-command:hover { transform: translateY(-2px); filter: brightness(1.2); }
                .btn-command:active { transform: translateY(0); }

                .action-panel {
                    display: flex; gap: 0.75rem; justify-content: flex-end; align-items: center;
                    background: rgba(255,255,255,0.02); padding: 0.5rem 1rem; border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .action-subgroup { display: flex; gap: 0.5rem; align-items: center; }
                .separator { width: 1px; height: 24px; background: rgba(255,255,255,0.1); margin: 0 0.25rem; }

                .glass-panel { background: rgba(255,255,255,0.03); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.05); }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), #6366f1)', padding: '0.75rem', borderRadius: '16px', boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.5)' }}>
                            <Building2 size={32} color="white" />
                        </div>
                        Ecosistema SaaS
                    </h1>
                    <p style={{ opacity: 0.5, fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>Gestión global de empresas logísticas y nodos de red.</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '700px' }}>
                    <div className="glass-panel" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', borderRadius: '14px' }}>
                        <Search size={20} style={{ opacity: 0.4, marginRight: '0.75rem' }} />
                        <input type="text" placeholder="Buscar por nombre de empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.95rem' }} />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}>
                        <Plus size={22} /> Nueva Empresa
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Empresas Registradas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}>{stats.total}</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--success-green)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--success-green)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Clientes Activos</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}>{stats.active}</div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5 }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
                    <p style={{ fontWeight: 800, letterSpacing: '0.1em' }}>SINCRONIZANDO ECOSISTEMA...</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="list-header" style={{ padding: '0 2rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div>Identidad Corporativa</div>
                        <div>Estado SaaS</div>
                        <div style={{ textAlign: 'right' }}>Centro de Control Pro</div>
                    </div>

                    {filteredTenants.map(t => (
                        <div key={t.id} className="glass-panel client-row" style={{ padding: '1.25rem 2rem', borderRadius: '24px', transition: 'background 0.3s' }}>
                            {/* Identidad */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '68px',
                                    height: '68px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: '0 12px 25px -10px rgba(0,0,0,0.4), 0 4px 10px -5px rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    flexShrink: 0,
                                    transition: 'transform 0.3s ease'
                                }}>
                                    {t.logoUrl ? (
                                        <img src={t.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} alt={t.nombreEmpresa} />
                                    ) : (
                                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Building2 size={32} color="var(--accent-blue)" style={{ opacity: 0.7 }} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{
                                        fontWeight: 900,
                                        fontSize: '1.35rem',
                                        color: 'white',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1
                                    }}>
                                        {t.nombreEmpresa}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 900,
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            color: 'var(--accent-blue)',
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>Nodo Logístico</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.3, fontFamily: 'monospace' }}>#{t.id.split('-')[0].toUpperCase()}</span>

                                        {/* AVISO DE CLAVE ACTUALIZADA */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: t.claveActualizada ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: t.claveActualizada ? '#4ade80' : '#fbbf24',
                                            border: `1px solid ${t.claveActualizada ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                        }}>
                                            {t.claveActualizada ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                            {t.claveActualizada ? 'CLAVE ACTUALIZADA' : 'CLAVE PENDIENTE'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="status-col">
                                <button onClick={() => toggleStatus(t.id)} style={{ background: t.activo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: t.activo ? '#4ade80' : '#f87171', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    {t.activo ? '● ACTIVO' : '○ INACTIVO'}
                                </button>
                            </div>

                            {/* Panel de Acciones Único */}
                            <div className="action-panel">
                                {/* Zona A: Gestión Operativa */}
                                <div className="action-subgroup">
                                    <div className="tooltip-container">
                                        <button onClick={() => onImpersonate(t.id)} className="btn-command" style={{ background: 'var(--accent-blue)' }}>
                                            <ExternalLink size={18} /><span>Gestionar</span>
                                        </button>
                                        <span className="tooltip-text">Entrar al panel operativo</span>
                                    </div>
                                    <div className="tooltip-container">
                                        <button onClick={() => {
                                            const pricing = t.pricings?.[0]?.precioCp || 150;
                                            setEditClient({ ...t, precioUnidad: pricing });
                                        }} className="btn-command" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Edit2 size={18} /><span>Config</span>
                                        </button>
                                        <span className="tooltip-text">Editar parámetros técnicos</span>
                                    </div>
                                </div>

                                <div className="separator" />

                                {/* Zona B: Soporte Técnico */}
                                <div className="action-subgroup">
                                    <div className="tooltip-container">
                                        <button onClick={() => handleShowAdminInfo(t.id)} className="btn-command" style={{ background: 'none', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60a5fa' }}>
                                            <UserCheck size={18} /><span>Admin</span>
                                        </button>
                                        <span className="tooltip-text">Ver email del administrador</span>
                                    </div>
                                    <div className="tooltip-container">
                                        <button onClick={() => handleSendCredentials(t.id)} className="btn-command" style={{ background: 'none', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success-green)' }}>
                                            <Mail size={18} /><span>Email</span>
                                        </button>
                                        <span className="tooltip-text">Re-enviar accesos al cliente</span>
                                    </div>
                                </div>

                                <div className="separator" />

                                {/* Zona C: Acciones Críticas */}
                                <div className="action-subgroup">
                                    {userRole === 'SUPER_ADMIN' && (
                                        <div className="tooltip-container">
                                            <button onClick={() => clearTableData(t.id, t.nombreEmpresa)} className="btn-command" style={{ background: 'none', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                                                <LayoutList size={18} /><span>Vaciar</span>
                                            </button>
                                            <span className="tooltip-text">Borrar datos (Choferes, Viajes)</span>
                                        </div>
                                    )}
                                    <div className="tooltip-container">
                                        <button onClick={() => handleDelete(t.id, t.nombreEmpresa)} className="btn-command" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <Trash2 size={18} /><span>Borrar</span>
                                        </button>
                                        <span className="tooltip-text">Eliminar empresa del SaaS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modales con Diseño Pro */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '3rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ marginBottom: '2rem', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Alta de Nueva Empresa</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nombre Corporativo</label>
                                <input type="text" placeholder="Ej: Logística Avanzada S.A." required value={newClient.nombreEmpresa} onChange={e => setNewClient({ ...newClient, nombreEmpresa: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', fontSize: '1rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Geocerca de Destino (mts)</label>
                                    <input type="text" placeholder="500" required value={newClient.config.geocerca_mts} onChange={e => setNewClient({ ...newClient, config: { ...newClient.config, geocerca_mts: e.target.value.replace(/[^0-9]/g, '') as any } })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', fontSize: '1rem', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tarifa ADT por CP ($)</label>
                                    <input type="number" placeholder="150" required value={newClient.precioUnidad} onChange={e => setNewClient({ ...newClient, precioUnidad: Number(e.target.value) })} style={{ width: '100%', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)', color: 'white', borderRadius: '14px', fontSize: '1rem', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '20px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={18} /> Credenciales del Administrador</div>
                                <input type="text" placeholder="Nombre Completo" required value={newClient.adminName} onChange={e => setNewClient({ ...newClient, adminName: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', marginBottom: '0.75rem' }} />
                                <input type="email" placeholder="Email de Acceso" required value={newClient.adminEmail} onChange={e => setNewClient({ ...newClient, adminEmail: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', marginBottom: '0.75rem' }} />
                                <input type="password" placeholder="Contraseña Inicial" required value={newClient.adminPassword} onChange={e => setNewClient({ ...newClient, adminPassword: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '14px', fontWeight: 700 }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '14px', fontWeight: 800 }}>Crear Empresa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editClient && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '3rem', borderRadius: '32px' }}>
                        <h2 style={{ marginBottom: '2rem', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Editar Parámetros</h2>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nombre Corporativo</label>
                                    <input type="text" placeholder="Nombre Empresa" required value={editClient.nombreEmpresa} onChange={e => setEditClient({ ...editClient, nombreEmpresa: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tarifa CP ($)</label>
                                    <input type="number" required value={editClient.precioUnidad} onChange={e => setEditClient({ ...editClient, precioUnidad: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)', color: 'white', borderRadius: '14px', outline: 'none', fontWeight: 800 }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Geocerca de Destino (mts)</label>
                                <input type="text" placeholder="Geocerca (mts)" required value={editClient.config?.geocerca_mts} onChange={e => setEditClient({ ...editClient, config: { ...editClient.config, geocerca_mts: e.target.value } })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>URL del Logo</label>
                                <input type="text" placeholder="URL del Logo Corporativo" value={editClient.logoUrl} onChange={e => setEditClient({ ...editClient, logoUrl: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>ID Chat Telegram (Alertas)</label>
                                <input type="text" placeholder="ID Chat Telegram" value={editClient.telegramChatId} onChange={e => setEditClient({ ...editClient, telegramChatId: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setEditClient(null)} className="btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '14px', fontWeight: 700 }}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '14px', fontWeight: 800 }}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmación Reset Clave */}
            {confirmReset && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '28px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(250, 204, 21, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem', color: '#facc15' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ fontWeight: 900, marginBottom: '1rem' }}>¿Confirmar Reset?</h2>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '2rem' }}>Se generará una nueva contraseña temporal para <b>{confirmReset.empresa}</b>. El acceso actual dejará de funcionar.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setConfirmReset(null)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>No, Cancelar</button>
                            <button onClick={handleResetPassword} className="btn-primary" style={{ flex: 1, background: '#facc15', color: '#000', padding: '1rem', borderRadius: '14px', fontWeight: 800 }}>Sí, Resetear</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Info Admin EDITABLE */}
            {adminInfo && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '28px', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-blue)' }}>
                            <UserCheck size={32} />
                        </div>
                        <h2 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Administrador del Nodo</h2>
                        <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '2rem' }}>Actualiza los datos de acceso para esta empresa.</p>

                        <form onSubmit={handleUpdateAdmin} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Nombre Completo</label>
                                    <input type="text" value={adminInfo.nombre} onChange={e => setAdminInfo({ ...adminInfo, nombre: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Correo Electrónico</label>
                                    <input type="email" value={adminInfo.email} onChange={e => setAdminInfo({ ...adminInfo, email: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '10px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setAdminInfo(null)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>Cerrar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Save size={18} /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Resultado Reset Password */}
            {resetResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem', color: 'var(--success-green)' }}>
                            <RefreshCw size={32} />
                        </div>
                        <h2 style={{ fontWeight: 900, marginBottom: '0.5rem', textAlign: 'center' }}>Nueva Clave Generada</h2>
                        <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '2rem', textAlign: 'center' }}>Se ha restablecido el acceso para <b>{resetResult.empresa}</b>.</p>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Usuario / Email</div>
                                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{resetResult.email}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contraseña Temporal</div>
                                <div style={{ fontWeight: 900, color: 'var(--success-green)', fontSize: '1.4rem', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{resetResult.temporaryPassword}</div>
                            </div>
                        </div>
                        <button onClick={() => setResetResult(null)} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 800 }}>Cerrar y Copiar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
