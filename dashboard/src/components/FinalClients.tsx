import { API_BASE_URL } from '../config';
import { Building, Plus, Trash2, Mail, Key, Search, ShieldCheck, TrendingUp, X, Save, Building2, LayoutList, BadgeDollarSign, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PricingManager from './PricingManager';
import { useNotification } from '../App';



export default function FinalClients({ tenantId }: { tenantId: string | null }) {
    const { notify } = useNotification();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState<any>(null);
    const [showAccessModal, setShowAccessModal] = useState<any>(null);
    const [showAuthorizedModal, setShowAuthorizedModal] = useState<any>(null);
    const [authorizedEmails, setAuthorizedEmails] = useState<any[]>([]);
    const [newAuthEmail, setNewAuthEmail] = useState({ email: '', asunto: 'SOLICITUD VIAJE' });
    const [showPricing, setShowPricing] = useState<{ id: string, name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const [newClient, setNewClient] = useState({
        nombreRazonSocial: '',
        email: ''
    });

    const fetchClients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/clients?tenantId=${tenantId || ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(res.data);
        } catch (err) {
            notify('Error al cargar la cartera de dadores', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [tenantId]);

    const fetchAuthorizedEmails = async (clientId: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/authorized-emails?clientId=${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAuthorizedEmails(res.data);
        } catch (err) {
            console.error('Error fetching authorized emails', err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/clients`, {
                ...newClient,
                tenantId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setNewClient({ nombreRazonSocial: '', email: '' });
            notify('Dador de carga registrado exitosamente', 'success');
            fetchClients();
        } catch (err) {
            notify('Error al crear el dador', 'error');
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            await axios.patch(`${API_BASE_URL}/management/clients/${editModal.id}`, {
                nombreRazonSocial: editModal.nombreRazonSocial
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditModal(null);
            notify('Nombre actualizado correctamente', 'success');
            fetchClients();
        } catch (err) {
            notify('Error al actualizar el dador', 'error');
        }
    };

    const handleUpdateUserEmail = async (userId: string, newEmail: string) => {
        try {
            setSendingEmail(true);
            const token = localStorage.getItem('admin_token');
            await axios.patch(`${API_BASE_URL}/management/users/${userId}/email`, {
                email: newEmail
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Email de acceso actualizado', 'success');

            // Recargar lista de usuarios
            const res = await axios.get(`${API_BASE_URL}/management/clients/${showAccessModal.id}/admin-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAccessModal({ ...showAccessModal, users: res.data });
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error al actualizar email', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCreateAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAccessModal.newEmail) return;
        try {
            setSendingEmail(true);
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/clients/${showAccessModal.id}/create-user`, {
                email: showAccessModal.newEmail,
                nombreCompleto: showAccessModal.nombreRazonSocial
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(`Acceso creado para ${showAccessModal.newEmail}. Clave temporal: ADT-321`, 'success', 'Envío Exitoso');

            // Recargar lista de usuarios en el modal
            const resInfo = await axios.get(`${API_BASE_URL}/management/clients/${showAccessModal.id}/admin-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAccessModal({ ...showAccessModal, users: resInfo.data, newEmail: '' });
            fetchClients();
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error al activar el acceso', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleResendCredentials = async (userId: string, email: string) => {
        try {
            setSendingEmail(true);
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/users/${userId}/resend-credentials`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(`Credenciales re-enviadas a ${email}`, 'success', 'Envío Exitoso');
        } catch (err: any) {
            notify('Error al re-enviar credenciales', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSendClientCredentials = async (clientId: string) => {
        try {
            setSendingEmail(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/management/clients/${clientId}/send-credentials`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(res.data.message, 'success', 'Envío Exitoso');
        } catch (err: any) {
            notify(err.response?.data?.message || 'Error al enviar credenciales', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleAddAuthEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/authorized-emails`, {
                clientId: showAuthorizedModal.id,
                email: newAuthEmail.email,
                asunto: showAuthorizedModal.asuntoClave
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewAuthEmail({ email: '', asunto: '' });
            notify('Email autorizado correctamente', 'success');
            fetchAuthorizedEmails(showAuthorizedModal.id);
        } catch (err) {
            notify('Error al autorizar email', 'error');
        }
    };

    const handleUpdateGlobalSubject = async (val: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/clients/${showAuthorizedModal.id}/update-subject`, {
                asunto: val
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAuthorizedModal({ ...showAuthorizedModal, asuntoClave: val.toUpperCase() });
            notify('Asunto global actualizado', 'success');
            setClients(clients.map(c => c.id === showAuthorizedModal.id ? { ...c, asuntoClave: val.toUpperCase() } : c));
        } catch (err) {
            notify('Error al actualizar el asunto', 'error');
        }
    };

    const handleDeleteAuthEmail = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`${API_BASE_URL}/management/authorized-emails/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Email removido', 'info');
            fetchAuthorizedEmails(showAuthorizedModal.id);
        } catch (err) {
            notify('Error al eliminar', 'error');
        }
    };

    const handleEmptyClient = async (id: string, name: string) => {
        if (!window.confirm(`¿ESTÁS SEGURO? Se borrará todo el historial de viajes, pagos y créditos de ${name}. El dador quedará como recién creado.`)) return;

        const secret = prompt('Escribe "ADT_CONFIRM_DELETE" para confirmar el vaciado del dador:');
        if (secret !== 'ADT_CONFIRM_DELETE') {
            notify('Código incorrecto', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/clients/${id}/empty`, { secret: 'ADT_CONFIRM_DELETE' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify(`Se ha vaciado el historial de ${name} con éxito`, 'success');
            fetchClients();
        } catch (err) {
            notify('Error al vaciar los datos del dador', 'error');
        }
    };

    const filteredClients = clients.filter(c =>
        c.nombreRazonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                .list-header, .client-row {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 4fr;
                    gap: 1.5rem;
                    align-items: center;
                }

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
                    .status-col::before { content: "SALDO:"; font-weight: 800; opacity: 0.5; font-size: 0.75rem; letter-spacing: 0.05em; }
                    .action-panel { flex-direction: column !important; gap: 0.5rem !important; background: none !important; border: none !important; padding: 0 !important; }
                    .action-subgroup { width: 100%; display: flex !important; flex-direction: row !important; gap: 0.5rem !important; }
                    .btn-command { width: 100%; justify-content: center !important; }
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

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', padding: '0.75rem', borderRadius: '16px' }}>
                            <Building2 size={32} color="white" />
                        </div>
                        Mis Clientes
                    </h1>
                    <p style={{ opacity: 0.5, fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>Gestión de dadores de carga y accesos al portal.</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '700px' }}>
                    <div className="glass-panel" style={{ flex: 1, minWidth: '250px', display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', borderRadius: '14px' }}>
                        <Search size={20} style={{ opacity: 0.4, marginRight: '0.75rem' }} />
                        <input type="text" placeholder="Buscar por dador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '14px', fontWeight: 800 }}>
                        <Plus size={22} /> Nuevo Dador
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5 }}>CARGANDO...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="list-header" style={{ padding: '0 2rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <div>Identidad del Dador</div>
                        <div>Wallet Vales</div>
                        <div style={{ textAlign: 'right' }}>Centro de Gestión Pro</div>
                    </div>

                    {filteredClients.map(c => (
                        <div key={c.id} className="glass-panel client-row" style={{ padding: '1.25rem 2rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>
                                    {c.nombreRazonSocial.substring(0, 2).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'white' }}>{c.nombreRazonSocial}</div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{c.email}</div>
                                </div>
                            </div>

                            <div className="status-col">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BadgeDollarSign size={20} /> {c.saldoCreditos || 0}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>Créditos Disponibles</div>
                                </div>
                            </div>

                            <div className="action-panel">
                                <div className="action-subgroup">
                                    <button onClick={() => setShowPricing({ id: c.id, name: c.nombreRazonSocial })} className="btn-command" style={{ background: '#6366f1' }}>
                                        <TrendingUp size={18} /><span>Tarifas</span>
                                    </button>
                                    <button onClick={() => { setShowAuthorizedModal(c); fetchAuthorizedEmails(c.id); }} className="btn-command" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Mail size={18} /><span>Emails IA</span>
                                    </button>
                                    <button onClick={() => handleSendClientCredentials(c.id)} className="btn-command" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
                                        <Mail size={18} /><span>Email Acceso</span>
                                    </button>
                                </div>
                                <div className="separator" />
                                <div className="action-subgroup">
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem('admin_token');
                                            const res = await axios.get(`${API_BASE_URL}/management/clients/${c.id}/admin-info`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            const users = Array.isArray(res.data) ? res.data : [];
                                            setShowAccessModal({ ...c, users, newEmail: '' });
                                        }}
                                        className="btn-command"
                                        style={{ background: 'none', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success-green)' }}
                                    >
                                        <Key size={18} /><span>Acceso</span>
                                    </button>
                                </div>
                                <div className="separator" />
                                <div className="action-subgroup">
                                    <button onClick={() => setEditModal(c)} className="btn-command" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.6 }}>
                                        <Edit2 size={18} /><span>Edit</span>
                                    </button>
                                    <button onClick={() => handleEmptyClient(c.id, c.nombreRazonSocial)} className="btn-command" style={{ background: 'none', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                                        <LayoutList size={18} /><span>Vaciar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: NUEVO DADOR DE CARGA */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '32px', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ width: '54px', height: '54px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)' }}>
                                <Building size={28} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Nuevo Dador</h2>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Registre un nuevo dador de carga en el sistema.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    <Building2 size={14} color="#818cf8" /> Razón Social / Nombre
                                </label>
                                <input
                                    type="text" required
                                    placeholder="Ej: Logística S.A."
                                    value={newClient.nombreRazonSocial}
                                    onChange={e => setNewClient({ ...newClient, nombreRazonSocial: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    <Mail size={14} color="#818cf8" /> Email de Contacto
                                </label>
                                <input
                                    type="email" required
                                    placeholder="ejemplo@empresa.com"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newClient.nombreRazonSocial || !newClient.email}
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', opacity: (!newClient.nombreRazonSocial || !newClient.email) ? 0.5 : 1 }}
                                >
                                    REGISTRAR DADOR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: GESTIÓN DE ACCESO (MULTI-USUARIO) */}
            {showAccessModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px', overflowY: 'auto', padding: '1rem' }}>
                    <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                        <button onClick={() => setShowAccessModal(null)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4ade80' }}>
                            <ShieldCheck size={32} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Accesos al Portal</h2>
                        </div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '2rem', opacity: 0.7 }}>Gestionar quiénes pueden entrar al portal de <b>{showAccessModal.nombreRazonSocial}</b>.</p>

                        {/* LISTADO DE USUARIOS EXISTENTES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {Array.isArray(showAccessModal.users) && showAccessModal.users.map((u: any) => (
                                <div key={u.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4 }}>EMAIL DE ACCESO</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleResendCredentials(u.id, u.email)}
                                                disabled={sendingEmail}
                                                style={{ background: 'none', border: 'none', color: '#facc15', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                {sendingEmail ? 'ENVIANDO...' : 'RE-ENVIAR / RESET'}
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="email"
                                        defaultValue={u.email}
                                        onBlur={(e) => handleUpdateUserEmail(u.id, e.target.value)}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '12px', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                </div>
                            ))}
                            {(!showAccessModal.users || showAccessModal.users.length === 0) && (
                                <div style={{ textAlign: 'center', opacity: 0.3, padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>No hay usuarios activos aún.</div>
                            )}
                        </div>

                        {/* AGREGAR NUEVO USUARIO */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-blue)' }}>Agregar Nuevo Usuario</h3>
                            <form onSubmit={handleCreateAccess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="email" required
                                    placeholder="Nuevo email@ejemplo.com"
                                    value={showAccessModal.newEmail || ''}
                                    onChange={e => setShowAccessModal({ ...showAccessModal, newEmail: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }}
                                />
                                <div style={{ padding: '1rem', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '14px', border: '1px dashed rgba(74, 222, 128, 0.3)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.25rem' }}>CONTRASEÑA INICIAL</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ade80' }}>ADT-321</p>
                                </div>
                                <button type="submit" disabled={sendingEmail || !showAccessModal.newEmail} className="btn-primary" style={{ padding: '1.1rem', fontWeight: 800, background: '#4ade80', color: '#064e3b', border: 'none', borderRadius: '14px', opacity: (sendingEmail || !showAccessModal.newEmail) ? 0.6 : 1 }}>
                                    {sendingEmail ? 'ENVIANDO...' : 'ACTIVAR Y ENVIAR EMAIL'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDICIÓN NOMBRE SOLAMENTE */}
            {editModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '100px', padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '32px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>Editar Dador</h2>
                        <form onSubmit={handleUpdateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Razón Social</label>
                                <input
                                    type="text" required
                                    value={editModal.nombreRazonSocial}
                                    onChange={e => setEditModal({ ...editModal, nombreRazonSocial: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditModal(null)}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <X size={18} /> Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '1rem', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Save size={18} /> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EMAILS AUTORIZADOS IA */}
            {showAuthorizedModal && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px', overflowY: 'auto', padding: '1rem' }}>
                    <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem', borderRadius: '32px', position: 'relative' }}>
                        <button onClick={() => setShowAuthorizedModal(null)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#60a5fa' }}>
                            <Mail size={32} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Emails Autorizados IA</h2>
                        </div>
                        <div style={{ background: 'rgba(96, 165, 250, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(96, 165, 250, 0.2)', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Asunto Global para IA</label>
                            <input type="text" defaultValue={showAuthorizedModal.asuntoClave} onBlur={(e) => handleUpdateGlobalSubject(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1rem', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 900, textAlign: 'center' }} />
                        </div>
                        <form onSubmit={handleAddAuthEmail} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                            <input type="email" placeholder="email@ejemplo.com..." required value={newAuthEmail.email} onChange={e => setNewAuthEmail({ ...newAuthEmail, email: e.target.value })} style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                            <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem' }}>Autorizar</button>
                        </form>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {authorizedEmails.map(ae => (
                                <div key={ae.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                                    <div style={{ color: 'white' }}>{ae.emailAutorizado}</div>
                                    <button onClick={() => handleDeleteAuthEmail(ae.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showPricing && <PricingManager tenantId={tenantId || ''} entityId={showPricing.id} entityName={showPricing.name} entityType="DADOR" onClose={() => { setShowPricing(null); fetchClients(); }} />}
        </div>
    );
}
