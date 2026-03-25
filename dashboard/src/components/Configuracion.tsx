import { Settings, Mail, Cpu, Save, ShieldCheck, Info, ExternalLink, Inbox } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../App';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Configuracion({ tenantId }: { tenantId: string | null }) {
    const { notify } = useNotification();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (tenantId) fetchTenantData();
    }, [tenantId]);

    const fetchTenantData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/tenants/${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTenant(res.data);
        } catch (err) {
            console.error('Error fetching tenant', err);
            notify('Error al cargar la configuración', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;
        try {
            setSaving(true);
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/tenants/${tenantId}/update`, tenant, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Configuración de empresa actualizada correctamente', 'success');
            fetchTenantData();
        } catch (err) {
            notify('Error al guardar los cambios en el servidor', 'error');
        } finally {
            setSaving(false);
        }
    };

    const applyImapPreset = (type: 'GMAIL' | 'O365' | 'HOSTING') => {
        const presets = {
            GMAIL: { host: 'imap.gmail.com', port: 993 },
            O365: { host: 'outlook.office365.com', port: 993 },
            HOSTING: { host: 'mail.tudominio.com', port: 993 }
        };
        const p = presets[type];
        setTenant({ ...tenant, imapHost: p.host, imapPort: p.port });
        notify(`Ajustes IMAP de ${type} aplicados`, 'info');
    };

    const applySmtpPreset = (type: 'GMAIL' | 'O365' | 'HOSTING') => {
        const presets = {
            GMAIL: { host: 'smtp.gmail.com', port: 465, secure: true },
            O365: { host: 'smtp.office365.com', port: 587, secure: false },
            HOSTING: { host: 'mail.tudominio.com', port: 465, secure: true }
        };
        const p = presets[type];
        setTenant({ ...tenant, smtpHost: p.host, smtpPort: p.port, smtpSecure: p.secure });
        notify(`Ajustes SMTP de ${type} aplicados`, 'info');
    };

    if (!tenantId) return <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>SELECCIONE UNA EMPRESA PARA CONFIGURAR</div>;
    if (loading || !tenant) return (
        <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5 }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
            <p style={{ fontWeight: 800, letterSpacing: '0.1em' }}>SINCRONIZANDO AJUSTES...</p>
        </div>
    );

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '3rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), #6366f1)', padding: '0.75rem', borderRadius: '16px' }}>
                            <Settings size={32} color="white" />
                        </div>
                        Configuración Empresa
                    </h1>
                    <p style={{ opacity: 0.5, marginTop: '0.5rem', fontWeight: 500 }}>Gestión maestra de inteligencia artificial y canales de comunicación del nodo.</p>
                </div>

                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '1.25rem 3rem', borderRadius: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)' }}>
                    <Save size={24} /> {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem' }}>

                {/* 1. INTELIGENCIA ARTIFICIAL (PRIORIDAD) */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                            <Cpu size={24} color="#a855f7" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Motor de Inteligencia</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Configuración de Google Gemini y reglas de carga.</p>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key Google Gemini</label>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                OBTENER CLAVE <ExternalLink size={12} />
                            </a>
                        </div>
                        <input type="password" value={tenant.geminiApiKey || ''} onChange={e => setTenant({ ...tenant, geminiApiKey: e.target.value })} placeholder="AI_..." style={{ width: '100%', padding: '1.1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', fontSize: '1rem', outline: 'none' }} />
                        <p style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '0.75rem', lineHeight: 1.4 }}>Indispensable para el análisis automático de pedidos por email y WhatsApp.</p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Moneda Base</label>
                        <select value={tenant.config?.moneda || 'ARS'} onChange={e => setTenant({ ...tenant, config: { ...tenant.config, moneda: e.target.value } })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }}>
                            <option value="ARS">Peso Argentino (ARS)</option>
                            <option value="USD">Dólar Estadounidense (USD)</option>
                        </select>
                    </div>
                </div>

                {/* 2. OPERACIÓN Y GEOCERCA */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                            <ShieldCheck size={24} color="var(--accent-blue)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reglas de Operación</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Control de GPS y validación de arribos.</p>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Radio Geocerca de Arribo (mts)</label>
                        <input type="number" value={tenant.config?.radio_geocerca || 500} onChange={e => setTenant({ ...tenant, config: { ...tenant.config, radio_geocerca: Number(e.target.value) } })} style={{ width: '100%', padding: '1.1rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--accent-blue)', color: 'white', borderRadius: '14px', fontSize: '1.2rem', fontWeight: 900, outline: 'none' }} />

                        <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '20px', border: '1px dashed rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <Info size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: 1.6 }}>
                                    <b>Arribo Automático:</b> El sistema detectará la llegada cuando el GPS entre en este radio.
                                    <br /><br />
                                    <b>Importante:</b> El estado cambiará a <b>ENTREGADO</b> internamente, pero el chofer mantiene la responsabilidad de finalizar el viaje manualmente desde su App.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. RECEPCIÓN (IMAP) */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                            <Inbox size={24} color="#10b981" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recepción (IMAP)</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Configura la cuenta para leer pedidos.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={() => applyImapPreset('GMAIL')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(250, 204, 21, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#facc15', fontSize: '0.7rem', letterSpacing: '0.05em' }}>GMAIL</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Google Cloud</div>
                        </button>
                        <button type="button" onClick={() => applyImapPreset('O365')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(96, 165, 250, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: '0.7rem', letterSpacing: '0.05em' }}>O365</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Microsoft</div>
                        </button>
                        <button type="button" onClick={() => applyImapPreset('HOSTING')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '0.7rem', letterSpacing: '0.05em' }}>HOSTING</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Propio / CPanel</div>
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input type="text" placeholder="Host (ej: imap.gmail.com)" value={tenant.imapHost || ''} onChange={e => setTenant({ ...tenant, imapHost: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem' }}>
                            <input type="number" placeholder="Puerto" value={tenant.imapPort || 993} onChange={e => setTenant({ ...tenant, imapPort: Number(e.target.value) })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                            <input type="text" placeholder="Email de la cuenta" value={tenant.imapUser || ''} onChange={e => setTenant({ ...tenant, imapUser: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4 }}>CLAVE DE APLICACIÓN</label>
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ fontSize: '0.6rem', color: '#10b981' }}>¿Cómo obtenerla?</a>
                            </div>
                            <input type="password" placeholder="Clave de 16 dígitos" value={tenant.imapPass || ''} onChange={e => setTenant({ ...tenant, imapPass: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        </div>
                    </div>
                </div>

                {/* 4. SALIDA (SMTP) */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                            <Mail size={24} color="#3b82f6" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Salida (SMTP)</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Configura el envío de avisos.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={() => applySmtpPreset('GMAIL')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(250, 204, 21, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#facc15', fontSize: '0.7rem', letterSpacing: '0.05em' }}>GMAIL</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Google Cloud</div>
                        </button>
                        <button type="button" onClick={() => applySmtpPreset('O365')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(96, 165, 250, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#60a5fa', fontSize: '0.7rem', letterSpacing: '0.05em' }}>O365</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Microsoft</div>
                        </button>
                        <button type="button" onClick={() => applySmtpPreset('HOSTING')} className="glass-panel" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '0.7rem', letterSpacing: '0.05em' }}>HOSTING</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, color: 'white' }}>Propio / CPanel</div>
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input type="text" placeholder="Host (ej: smtp.gmail.com)" value={tenant.smtpHost || ''} onChange={e => setTenant({ ...tenant, smtpHost: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem' }}>
                            <input type="number" placeholder="587" value={tenant.smtpPort || 587} onChange={e => setTenant({ ...tenant, smtpPort: Number(e.target.value) })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                            <input type="text" placeholder="Email de la cuenta" value={tenant.smtpUser || ''} onChange={e => setTenant({ ...tenant, smtpUser: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        </div>
                        <input type="password" placeholder="Contraseña de la cuenta" value={tenant.smtpPass || ''} onChange={e => setTenant({ ...tenant, smtpPass: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <input type="text" placeholder="Nombre Remitente (ej: Samsung Logística)" value={tenant.smtpFrom || ''} onChange={e => setTenant({ ...tenant, smtpFrom: e.target.value })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={tenant.smtpSecure || false} onChange={e => setTenant({ ...tenant, smtpSecure: e.target.checked })} /> SSL/TLS
                            </label>
                        </div>
                    </div>
                </div>

                {/* 5. AYUDA Y GUÍAS */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid rgba(56, 189, 248, 0.2)', background: 'rgba(56, 189, 248, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                            <Info size={24} color="var(--accent-blue)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ayuda y Guías</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Gestioná las guías visuales de usuario.</p>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Si ocultaste las guías de ayuda en las distintas secciones y querés volver a verlas, podés reactivarlas todas con este botón.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                Object.keys(localStorage).forEach(key => {
                                    if (key.startsWith('adt_help_disabled_')) {
                                        localStorage.removeItem(key);
                                    }
                                });
                                localStorage.removeItem('adt_help_global_disabled');
                                notify('Todas las guías de ayuda han sido reactivadas', 'success');
                                // Refresh current view if needed or give feedback
                            }}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 800, color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', background: 'rgba(56, 189, 248, 0.05)' }}
                        >
                            REACTIVAR TODAS LAS GUÍAS
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
