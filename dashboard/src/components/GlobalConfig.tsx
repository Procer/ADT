import { API_BASE_URL } from '../config';
import { Server, Mail, Lock, User, Save, ShieldAlert, Info, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';



export default function GlobalConfig() {
    const [systemConfig, setSystemConfig] = useState<any>({
        smtpConfig: { host: '', port: 587, user: '', pass: '', from: '', secure: false },
        telegramConfig: { botToken: '', globalChatId: '', enabled: false }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passHint, setPassHint] = useState('Usa la contraseña de tu cuenta de correo.');
    const [passLink, setPassLink] = useState<string | null>(null);

    const applyPreset = (type: 'GMAIL' | 'O365' | 'HOSTING') => {
        const presets = {
            GMAIL: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                hint: '⚠️ Requiere "Contraseña de Aplicación" generada en Google.',
                link: 'https://myaccount.google.com/apppasswords'
            },
            O365: {
                host: 'smtp.office365.com',
                port: 587,
                secure: false,
                hint: '⚠️ Requiere habilitar "SMTP Autenticado" en el panel de Admin.',
                link: 'https://admin.microsoft.com/Adminportal/Home#/users'
            },
            HOSTING: {
                host: 'mail.tudominio.com',
                port: 465,
                secure: true,
                hint: 'Usa la contraseña estándar de la cuenta creada en tu panel.',
                link: null
            }
        };

        const p = presets[type];
        setSystemConfig({
            ...systemConfig,
            smtpConfig: {
                ...systemConfig.smtpConfig,
                host: p.host,
                port: p.port,
                secure: p.secure
            }
        });
        setPassHint(p.hint);
        setPassLink(p.link);
    };

    useEffect(() => {
        fetchGlobalConfig();
    }, []);

    const fetchGlobalConfig = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/management/system-config`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const config = res.data;
            if (!config.telegramConfig) {
                config.telegramConfig = { botToken: '', globalChatId: '', enabled: false };
            }

            setSystemConfig(config);
        } catch (err) {
            console.error('Error fetching global config', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_BASE_URL}/management/system-config`, systemConfig, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Ajustes globales de ADT actualizados');
        } catch (err) {
            alert('Error al guardar configuración global');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>CARGANDO AJUSTES DEL SISTEMA...</div>;

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert size={40} color="#a855f7" /> Administración Global
                </h1>
                <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Configuración maestra del motor ADT. Estos ajustes afectan a la comunicación con todos los clientes logísticos.</p>
            </div>

            {/* Presets Guide at the top */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={18} color="#a855f7" /> Configuración Rápida (Presets)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <button type="button" onClick={() => applyPreset('GMAIL')} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <div style={{ fontWeight: 800, color: '#facc15', marginBottom: '0.5rem', fontSize: '0.85rem' }}>GMAIL / GOOGLE</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'white' }}>smtp.gmail.com (Puerto 465)</div>
                    </button>

                    <button type="button" onClick={() => applyPreset('O365')} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: '0.5rem', fontSize: '0.85rem' }}>OFFICE 365</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'white' }}>smtp.office365.com (Puerto 587)</div>
                    </button>

                    <button type="button" onClick={() => applyPreset('HOSTING')} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.2s' }}>
                        <div style={{ fontWeight: 800, color: '#4ade80', marginBottom: '0.5rem', fontSize: '0.85rem' }}>HOSTING PROPIO</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'white' }}>mail.tudominio.com (Puerto 465)</div>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="glass-panel" style={{ padding: '3rem', borderRadius: '32px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* SMTP SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.75rem', borderRadius: '14px' }}>
                            <Mail size={24} color="#a855f7" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Correo Saliente ADT (Maestro)</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Este SMTP se usará para enviar credenciales y notificaciones oficiales de la plataforma.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Host SMTP</label>
                                <div style={{ position: 'relative' }}>
                                    <Server size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', opacity: 0.3 }} />
                                    <input type="text" value={systemConfig.smtpConfig.host} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, host: e.target.value } })} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="smtp.ejemplo.com" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Puerto</label>
                                <input type="number" value={systemConfig.smtpConfig.port} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, port: Number(e.target.value) } })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Usuario Autenticación</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', opacity: 0.3 }} />
                                    <input type="text" value={systemConfig.smtpConfig.user} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, user: e.target.value } })} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', opacity: 0.3 }} />
                                    <input type="password" value={systemConfig.smtpConfig.pass} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, pass: e.target.value } })} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#a855f7', marginTop: '0.5rem', fontWeight: 600, fontStyle: 'italic', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {passHint}
                                    {passLink && (
                                        <a href={passLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                                            Configurar aquí
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nombre Remitente ADT</label>
                                <input type="text" value={systemConfig.smtpConfig.from} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, from: e.target.value } })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="ADT PRO <no-reply@adt.com>" />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '1.5rem' }}>
                                <input type="checkbox" checked={systemConfig.smtpConfig.secure} onChange={e => setSystemConfig({ ...systemConfig, smtpConfig: { ...systemConfig.smtpConfig, secure: e.target.checked } })} />
                                <span style={{ fontSize: '0.85rem' }}>SSL/TLS</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* TELEGRAM SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(0, 136, 204, 0.1)', padding: '0.75rem', borderRadius: '14px' }}>
                            <Send size={24} color="#0088cc" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Alertas Telegram (Admin Global)</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Configura el bot que enviará reportes operativos a los administradores del sistema.</p>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={systemConfig.telegramConfig.enabled} onChange={e => setSystemConfig({ ...systemConfig, telegramConfig: { ...systemConfig.telegramConfig, enabled: e.target.checked } })} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Activo</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Telegram Bot Token</label>
                            <input type="text" value={systemConfig.telegramConfig.botToken} onChange={e => setSystemConfig({ ...systemConfig, telegramConfig: { ...systemConfig.telegramConfig, botToken: e.target.value } })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="Ej: 123456:ABC-DEF..." />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Chat ID Global (Admin)</label>
                            <input type="text" value={systemConfig.telegramConfig.globalChatId} onChange={e => setSystemConfig({ ...systemConfig, telegramConfig: { ...systemConfig.telegramConfig, globalChatId: e.target.value } })} style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }} placeholder="Ej: -100123456789" />
                        </div>
                    </div>
                </div>

                {/* INTELIGENCIA ARTIFICIAL SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '14px' }}>
                            <Lock size={24} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Inteligencia Artificial (Master API Key)</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Configura la clave de Google Gemini que usará ADT como respaldo global ( fallback ) para el Copilot y extracción de emails.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>GEMINI API KEY (Global Fallback)</label>
                            <input
                                type="password"
                                value={systemConfig.geminiApiKey || ''}
                                onChange={e => setSystemConfig({ ...systemConfig, geminiApiKey: e.target.value })}
                                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', outline: 'none' }}
                                placeholder="Pega aquí tu clave maestra de IA..."
                            />
                            <p style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '0.5rem', fontWeight: 600 }}>Esta clave solo se usará si el cliente logístico no tiene configurada una clave propia.</p>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '1.25rem', borderRadius: '16px', background: '#a855f7', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <Save size={24} /> {saving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN ADT'}
                </button>
            </form>

            <div className="glass-panel" style={{ marginTop: '4rem', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#f87171', marginBottom: '1.5rem' }}>
                    <ShieldAlert size={32} />
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>DANGER ZONE: Reset del Sistema</h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, color: 'white' }}>Esta acción borrará TODOS los datos maestros y operativos (Viajes, Choferes, Clientes, Tenants). Es irreversible.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>Para confirmar el reset total, escriba la frase: <span style={{ color: 'white', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>RESETEAR SISTEMA TOTAL</span></p>
                    <input
                        type="text"
                        placeholder="Escriba la frase de confirmación..."
                        onChange={(e) => (window as any)._confirmReset = (e.target as HTMLInputElement).value}
                        style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'white', borderRadius: '12px', outline: 'none' }}
                    />
                    <button
                        onClick={async () => {
                            if ((window as any)._confirmReset !== 'RESETEAR SISTEMA TOTAL') {
                                alert('❌ La frase de confirmación es incorrecta.');
                                return;
                            }
                            if (!confirm('🚨 ¿ESTÁ ABSOLUTAMENTE SEGURO? Se perderán todos los datos y se cerrará su sesión.')) return;

                            try {
                                const token = localStorage.getItem('admin_token');
                                await axios.post(`${API_BASE_URL}/management/system/reset`, {
                                    confirmation: 'RESETEAR SISTEMA TOTAL'
                                }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                alert('🔥 SISTEMA RESETEADO CON ÉXITO. Redireccionando...');
                                localStorage.clear();
                                window.location.href = '/';
                            } catch (err: any) {
                                alert('Error al ejecutar reset: ' + (err.response?.data?.message || err.message));
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        EJECUTAR RESET TOTAL DEL SISTEMA (KILL-SWITCH)
                    </button>
                </div>
            </div>
        </div>
    );
}
