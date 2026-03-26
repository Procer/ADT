import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Truck, ShieldCheck, LogOut, CreditCard, ActivityIcon, Users, Store, Navigation, FileText, Building, Terminal, ChevronDown, ChevronRight, Mail, Settings, TrendingUp, DollarSign, ShieldAlert, X, CheckCircle, AlertTriangle, InfoIcon } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';
import { API_BASE_URL } from './config';

// Notification Context
const NotificationContext = createContext<any>(null);

export const useNotification = () => useContext(NotificationContext);

function ToastContainer({ notifications, remove }: any) {
  return (
    <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'none' }}>
      {notifications.map((n: any) => (
        <div key={n.id} className="glass-panel" style={{
          pointerEvents: 'auto',
          padding: '1rem 1.5rem',
          borderRadius: '16px',
          minWidth: '300px',
          maxWidth: '450px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          border: `1px solid ${n.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : n.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          animation: 'toast-in 0.3s ease-out forwards'
        }}>
          <style>{`
                        @keyframes toast-in {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
          <div style={{ color: n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : '#a855f7' }}>
            {n.type === 'success' ? <CheckCircle size={20} /> : n.type === 'error' ? <AlertTriangle size={20} /> : <InfoIcon size={20} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{n.title || (n.type === 'success' ? 'Éxito' : 'Notificación')}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, color: 'white', marginTop: '0.1rem' }}>{n.message}</div>
          </div>
          <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.3, cursor: 'pointer', padding: '0.25rem' }}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ChangePasswordOverlay({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const { notify } = useNotification();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) return notify('La contraseña debe tener al menos 6 caracteres', 'error');
    if (newPass !== confirmPass) return notify('Las contraseñas no coinciden', 'error');

    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API_BASE_URL}/auth/change-password`, { newPass }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      notify('Contraseña actualizada con éxito', 'success');
      onPasswordChanged();
    } catch (err) {
      notify('Error al cambiar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderRadius: '32px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
          <ShieldCheck size={32} color="#a855f7" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>Seguridad Requerida</h2>
        <p style={{ opacity: 0.5, fontSize: '0.9rem', marginBottom: '2.5rem' }}>Por seguridad, debes cambiar tu contraseña temporal antes de continuar al panel de control.</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nueva Contraseña</label>
            <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Confirmar Contraseña</label>
            <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', outline: 'none' }} placeholder="Repite la contraseña" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '1.25rem', borderRadius: '16px', fontWeight: 800, width: '100%', marginTop: '1rem' }}>
            {loading ? 'ACTUALIZANDO...' : 'ESTABLECER NUEVA CLAVE'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Components
import Overview from './components/Overview';
import Unidades from './components/Unidades';
import Auditorias from './components/Auditorias';
import Alertas from './components/Alertas';
import Configuracion from './components/Configuracion';
import GlobalConfig from './components/GlobalConfig';
import Choferes from './components/Choferes';
import Clientes from './components/Clientes';
import Reportes from './components/Reportes';
import Login from './components/Login';
import Finanzas from './components/Finanzas';
import Viajes from './components/Viajes';
import ProfitabilityDashboard from './components/ProfitabilityDashboard';
import CollectionsManager from './components/CollectionsManager';
import SettlementsManager from './components/SettlementsManager';
import GlobalFinance from './components/GlobalFinance';
import AuditoriaCreditos from './components/AuditoriaCreditos';
import { BadgeDollarSign, Coins } from 'lucide-react';
import ClientPortal from './components/ClientPortal';
import FinalClients from './components/FinalClients';
import LogVisor from './components/LogVisor';
import AppLogs from './components/AppLogs';
import ServerPm2Logs from './components/ServerPm2Logs';
import SolicitudesEntrantes from './components/SolicitudesEntrantes';
import Finance360ToCollect from './components/Finance360ToCollect';
import Finance360Settlements from './components/Finance360Settlements';
// import AiChatCopilot from './components/AiChatCopilot';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import { useNavigate } from 'react-router-dom';

function AppContent({
  currentUser,
  activeTenantName,
  stats,
  activeTrips,
  isSuperAdmin,
  effectiveTenantId,
  isImpersonating,
  openMenus,
  toggleSubmenu,
  handleLogout,
  setImpersonation
}: any) {
  const navigate = useNavigate();
  const isFinalClient = currentUser?.role === 'CLIENT';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <style>{`
          .dashboard-container {
            display: flex;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            background: #0f172a;
          }
          .mobile-header {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            padding: 0 1rem;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .sidebar {
            width: 280px;
            height: 100%;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1100;
          }
          @media (max-width: 1024px) {
            .mobile-header { display: flex; }
            .sidebar {
              position: fixed;
              left: 0;
              top: 0;
              bottom: 0;
              transform: translateX(-110%);
            }
            .sidebar-open .sidebar {
              transform: translateX(0);
              box-shadow: 20px 0 50px rgba(0,0,0,0.5);
            }
            .main-content {
              padding: 1rem 0.5rem !important;
              padding-top: 70px !important;
            }
            .sidebar-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.6);
              backdrop-filter: blur(4px);
              z-index: 1050;
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            .sidebar-open .sidebar-overlay { 
              display: block;
              opacity: 1;
            }
          }
          
          /* FIX DEFINITIVO E INTELIGENTE PARA MODALES */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            z-index: 2000;
            overflow-y: auto;
            padding: 10vh 1rem 15rem 1rem; /* Bajamos el modal un 10% de la pantalla */
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          .modal-content, .glass-panel.modal-content {
            margin: 0 auto;
            position: relative;
            max-width: 100%;
            max-height: none !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          }
          @media (max-width: 1024px) {
            .modal-overlay { 
              padding: 4vh 0.5rem 2rem 0.5rem; /* Reducimos notablemente el padding superior e inferior */
            }
            .modal-content { 
              width: 100% !important; 
              border-radius: 20px !important;
              margin-bottom: 0 !important;
            }
          }
        `}</style>

      {/* HEADER MÓVIL */}
      <div className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <LayoutDashboard size={24} />
        </button>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-blue)' }}>ANKA SYSTEM</div>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </div>

      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />

      <aside className="sidebar glass-panel">
        <div className="logo" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-icon" style={{ background: 'var(--accent-blue)', color: 'white', padding: '0.5rem', borderRadius: '8px', fontWeight: 800 }}>ANKA</div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>ANKA System</h2>
            <p style={{ fontSize: '0.6rem', opacity: 0.6 }}>
              {isFinalClient ? 'Portal Dador de Carga' : isImpersonating ? `Empresa: ${activeTenantName}` : 'Administración Global'}
            </p>
          </div>
        </div>

        <nav
          style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('a') && window.innerWidth < 1024) {
              setIsSidebarOpen(false);
            }
          }}
        >
          {isFinalClient && (
            <>
              <div onClick={() => toggleSubmenu('portal')} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)' }}>Mi Portal</span>
                {openMenus.portal ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {openMenus.portal && (
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                  <NavLink to="/client-portal" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ActivityIcon size={18} /> <span>Seguimiento en Vivo</span>
                  </NavLink>
                </div>
              )}
            </>
          )}

          {!isFinalClient && (
            <>
              <div onClick={() => toggleSubmenu('principal')} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menú Principal</span>
                {openMenus.principal ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {openMenus.principal && (
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                  <NavLink to="/overview" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <LayoutDashboard size={18} /> <span>Overview</span>
                  </NavLink>
                </div>
              )}
            </>
          )}

          {isSuperAdmin && !isFinalClient && (
            <>
              <div onClick={() => toggleSubmenu('admin')} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administración Global</span>
                {openMenus.admin ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {openMenus.admin && (
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                  <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Store size={18} /> <span>Empresas Clientes</span>
                  </NavLink>
                  <NavLink to="/global-finance" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <BadgeDollarSign size={18} /> <span>Estado de Cuenta Global</span>
                  </NavLink>
                  <NavLink to="/global-config" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ShieldAlert size={18} /> <span>Administración ANKA</span>
                  </NavLink>
                  <NavLink to="/system-logs" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Terminal size={18} /> <span>Auditoría de Acciones</span>
                  </NavLink>
                  <NavLink to="/app-logs" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ActivityIcon size={18} /> <span>Errores de Apps</span>
                  </NavLink>
                  <NavLink to="/server-logs" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Terminal size={18} /> <span>Logs del Servidor</span>
                  </NavLink>
                </div>
              )}
            </>
          )}

          {effectiveTenantId && !isFinalClient && (
            <>
              <div onClick={() => toggleSubmenu('operacion')} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)' }}>Operación Empresa</span>
                {openMenus.operacion ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {openMenus.operacion && (
                <div style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>
                  <NavLink to="/viajes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Navigation size={18} /> <span>Viajes</span>
                  </NavLink>
                  <NavLink to="/solicitudes-email" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Mail size={18} /> <span>Solicitudes Email</span>
                  </NavLink>
                  <NavLink to="/mis-clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Building size={18} /> <span>Dadores de Carga</span>
                  </NavLink>
                  <NavLink to="/choferes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Users size={18} /> <span>Choferes</span>
                  </NavLink>
                  <NavLink to="/unidades" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Truck size={18} /> <span>Unidades</span>
                  </NavLink>
                  <NavLink to="/finanzas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <CreditCard size={18} /> <span>Estado de Cuenta ANKA</span>
                  </NavLink>
                  <NavLink to="/finance-360-collect" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <DollarSign size={18} /> <span>Cobranzas a Dadores</span>
                  </NavLink>
                  <NavLink to="/finance-360-settlements" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Truck size={18} /> <span>Liquidaciones Choferes</span>
                  </NavLink>
                  <NavLink to="/profitability" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <TrendingUp size={18} /> <span>Rentabilidad Neta</span>
                  </NavLink>
                  <NavLink to="/auditoria-creditos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Coins size={18} /> <span>Auditoría Créditos</span>
                  </NavLink>
                  <NavLink to="/alertas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ActivityIcon size={18} /> <span>Alertas</span>
                  </NavLink>
                  <NavLink to="/reportes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FileText size={18} /> <span>Reportes</span>
                  </NavLink>
                  <NavLink to="/config" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Settings size={18} /> <span>Configuración IA/Email</span>
                  </NavLink>
                </div>
              )}
            </>
          )}
          {isSuperAdmin && !isFinalClient && (
            <>
              <div onClick={() => toggleSubmenu('sistema')} style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seguridad y Auditoría</span>
                {openMenus.sistema ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {openMenus.sistema && (
                <div style={{ paddingLeft: '0.5rem' }}>
                  <NavLink to="/auditorias" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ShieldCheck size={18} /> <span>Auditoría Global</span>
                  </NavLink>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: 'white' }}>
              {currentUser?.nombreCompleto?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.nombreCompleto || 'Usuario'}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, color: 'var(--accent-blue)' }}>
                {isSuperAdmin ? 'Dueño del Sistema' : isFinalClient ? 'Dador de Carga' : 'Administrador de Empresa'}
              </div>
            </div>
          </div>

          {isImpersonating && (
            <button
              onClick={() => setImpersonation(null)}
              style={{ width: '100%', marginBottom: '0.75rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 800 }}
            >
              SALIR DE EMPRESA
            </button>
          )}

          <button onClick={handleLogout} className="nav-item logout" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: '#f87171' }}>
            <LogOut size={20} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/overview" element={<Overview stats={stats} activeTrips={activeTrips} />} />
          <Route path="/unidades" element={<Unidades tenantId={effectiveTenantId} />} />
          <Route path="/choferes" element={<Choferes tenantId={effectiveTenantId} />} />
          <Route path="/viajes" element={<Viajes tenantId={effectiveTenantId} />} />
          <Route path="/solicitudes-email" element={<SolicitudesEntrantes tenantId={effectiveTenantId} />} />
          <Route path="/clientes" element={<Clientes onImpersonate={setImpersonation} />} />
          <Route path="/global-finance" element={<GlobalFinance onSelectTenant={(id: string, view: string) => {
            setImpersonation(id);
            navigate(`/${view}`);
          }} />} />
          <Route path="/finanzas" element={<Finanzas tenantId={effectiveTenantId} />} />
          <Route path="/collections" element={<CollectionsManager tenantId={effectiveTenantId} />} />
          <Route path="/settlements" element={<SettlementsManager tenantId={effectiveTenantId} />} />
          <Route path="/finance-360-collect" element={<Finance360ToCollect tenantId={effectiveTenantId} />} />
          <Route path="/finance-360-settlements" element={<Finance360Settlements tenantId={effectiveTenantId} />} />
          <Route path="/profitability" element={<ProfitabilityDashboard tenantId={effectiveTenantId} />} />
          <Route path="/auditoria-creditos" element={<AuditoriaCreditos tenantId={effectiveTenantId} />} />
          <Route path="/alertas" element={<Alertas tenantId={effectiveTenantId} />} />
          <Route path="/auditorias" element={<Auditorias tenantId={effectiveTenantId} />} />
          <Route path="/reportes" element={<Reportes tenantId={effectiveTenantId} />} />
          <Route path="/mis-clientes" element={<FinalClients tenantId={effectiveTenantId} />} />
          <Route path="/system-logs" element={<LogVisor />} />
          <Route path="/app-logs" element={<AppLogs />} />
          <Route path="/server-logs" element={<ServerPm2Logs />} />
          <Route path="/client-portal" element={<ClientPortal clientId={currentUser?.clientId} />} />
          <Route path="/config" element={<Configuracion tenantId={effectiveTenantId} />} />
          <Route path="/global-config" element={<GlobalConfig />} />
          <Route path="/" element={<Navigate to={currentUser?.role === 'CLIENT' ? '/client-portal' : '/overview'} replace />} />
        </Routes>

        {/* Floating AI Copilot - Oculto temporalmente
        {effectiveTenantId && (
          <AiChatCopilot tenantId={effectiveTenantId} />
        )}
        */}
      </main>
    </div>
  );
}

export default function App() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification]);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || 'null');
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_tenant_id');
    if (saved === 'null' || saved === 'undefined' || !saved) return null;
    return saved;
  });

  const [activeTenantName, setActiveTenantName] = useState<string>('');
  const [stats, setStats] = useState({ active: 0, audits: 0, delayed: 0 });
  const [activeTrips, setActiveTrips] = useState<any[]>([]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isTenantAdmin = currentUser?.role === 'TENANT_ADMIN';
  const isFinalClient = currentUser?.role === 'CLIENT';
  const effectiveTenantId = isTenantAdmin ? currentUser?.tenantId : activeTenantId;
  const isImpersonating = isSuperAdmin && !!activeTenantId;

  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    principal: !isImpersonating && !isFinalClient,
    admin: !isImpersonating && !isFinalClient,
    operacion: !isImpersonating && !isFinalClient,
    sistema: !isImpersonating && !isFinalClient,
    portal: isFinalClient
  });

  const toggleSubmenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleLogin = (user: any, authToken: string) => {
    if (user.email === 'admin@adt.com') {
      user.role = 'SUPER_ADMIN';
      user.tenantId = null;
    }
    setCurrentUser(user);
    setToken(authToken);
    const initialTenantId = user.role === 'SUPER_ADMIN' ? null : user.tenantId;
    setActiveTenantId(initialTenantId);

    localStorage.setItem('admin_user', JSON.stringify(user));
    localStorage.setItem('admin_token', authToken);
    if (initialTenantId) localStorage.setItem('active_tenant_id', initialTenantId);
    else localStorage.removeItem('active_tenant_id');
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setToken(null);
    setActiveTenantId(null);
    window.location.href = '/';
  };

  const setImpersonation = (tenantId: string | null) => {
    setActiveTenantId(tenantId);
    if (tenantId) localStorage.setItem('active_tenant_id', tenantId);
    else {
      localStorage.removeItem('active_tenant_id');
      setActiveTenantName('');
    }
    setOpenMenus({
      principal: !tenantId,
      admin: !tenantId,
      operacion: !!tenantId,
      sistema: !tenantId,
      portal: false
    });
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    let lastUpdate = 0;
    const UPDATE_THRESHOLD = 2000;

    const fetchData = async () => {
      const now = Date.now();
      if (now - lastUpdate < UPDATE_THRESHOLD) return;
      lastUpdate = now;

      try {
        const statsRes = await axios.get(`${API_BASE_URL}/management/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          setStats(statsRes.data);
          if (statsRes.data.activeTrips) {
            setActiveTrips([...statsRes.data.activeTrips]);
          }
        }
      } catch (err) { console.error('Error stats', err); }
    };

    const fetchTenantName = async () => {
      if (!activeTenantId) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/management/tenants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const current = res.data.find((t: any) => t.id === activeTenantId);
        if (isMounted && current) setActiveTenantName(current.nombreEmpresa);
      } catch (err) { console.error('Error tenant name', err); }
    };

    fetchData();
    fetchTenantName();

    const socket = io(API_BASE_URL);
    socket.on('gpsUpdate', fetchData);

    return () => {
      isMounted = false;
      socket.off('gpsUpdate');
      socket.disconnect();
    };
  }, [token, activeTenantId]);

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <NotificationContext.Provider value={{ notify }}>
      <ToastContainer notifications={notifications} remove={removeNotification} />

      {currentUser?.mustChangePassword && (
        <ChangePasswordOverlay onPasswordChanged={() => {
          const updatedUser = { ...currentUser, mustChangePassword: false };
          setCurrentUser(updatedUser);
          localStorage.setItem('admin_user', JSON.stringify(updatedUser));
        }} />
      )}

      <BrowserRouter>
        <AppContent
          currentUser={currentUser}
          token={token}
          activeTenantId={activeTenantId}
          activeTenantName={activeTenantName}
          stats={stats}
          activeTrips={activeTrips}
          isSuperAdmin={isSuperAdmin}
          effectiveTenantId={effectiveTenantId}
          isImpersonating={isImpersonating}
          openMenus={openMenus}
          toggleSubmenu={toggleSubmenu}
          handleLogout={handleLogout}
          setImpersonation={setImpersonation}
        />
      </BrowserRouter>
    </NotificationContext.Provider>
  );
}
