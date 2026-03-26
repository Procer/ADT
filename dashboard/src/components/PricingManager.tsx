import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Calculator, Save, X, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotification } from '../App';



interface PricingManagerProps {
    tenantId: string;
    entityId: string;
    entityName: string;
    entityType: 'DADOR' | 'CHOFER';
    onClose: () => void;
}

export default function PricingManager({ tenantId, entityId, entityName, entityType, onClose }: PricingManagerProps) {
    const { notify } = useNotification();
    const [rules, setRules] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [newRule, setNewRule] = useState({
        baseCalculation: 'KM',
        baseValue: 0,
        conditionals: {
            espera_hora: 0,
            umbral_espera_hs: 3,
            nocturno_plus: 0
        }
    });
    const [simulation, setSimulation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'FORM' | 'SIMULATION'>('FORM');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        setUserRole(user.role);
        fetchRules();
    }, [entityId]);

    const fetchRules = async () => {
        const token = localStorage.getItem('admin_token');
        const res = await axios.get(`${API_BASE_URL}/management/pricing/rules?tenantId=${tenantId}&entityId=${entityId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setRules(res.data);
    };

    const handleDeleteRule = async (id: string) => {
        if (!window.confirm('¿Desea eliminar este registro histórico de tarifa? Esta acción es irreversible.')) return;

        try {
            const token = localStorage.getItem('admin_token');
            // Usamos la ruta única definitiva para evitar colisiones 404
            const url = `${API_BASE_URL}/management/force-delete-pricing/${id}?role=${userRole}`;
            console.log('Ejecutando borrado oficial a:', url);

            await axios.delete(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Registro de tarifa eliminado', 'success');
            fetchRules();
        } catch (err) {
            console.error('Error en eliminación:', err);
            notify('Error al eliminar la tarifa', 'error');
        }
    };

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            // Usar el tenantId de la regla vigente si el prop llega como null/empty (caso SuperAdmin)
            const effectiveTenantId = tenantId || (rules.length > 0 ? rules[0].tenantId : null);

            if (!effectiveTenantId) {
                notify('No se pudo determinar la empresa para la simulación', 'error');
                return;
            }

            const res = await axios.post(`${API_BASE_URL}/management/pricing/simulate`, {
                tenantId: effectiveTenantId,
                entityId,
                entityType,
                ...newRule
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimulation(res.data);
            setStep('SIMULATION');
        } catch (err) {
            notify('Error al conectar con el motor de simulación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const effectiveTenantId = tenantId || (rules.length > 0 ? rules[0].tenantId : null);

            await axios.post(`${API_BASE_URL}/management/pricing/rules`, {
                tenantId: effectiveTenantId,
                entityId,
                entityType,
                ...newRule,
                validFrom: new Date()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('Protocolo de cambio de tarifa completado', 'success');
            onClose();
        } catch (err) {
            notify('Error al registrar la nueva tarifa', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ width: '600px', padding: '2.5rem' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                >
                    <X size={24} />
                </button>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <TrendingUp color="var(--accent-blue)" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestión de Inteligencia Financiera</h2>
                    </div>
                    <p className="text-secondary">{entityType === 'DADOR' ? 'Dador de Carga' : 'Chofer'}: <strong>{entityName}</strong></p>
                </div>

                {/* NUEVO: Visualización de Tarifa Actual e Historial */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tarifa Vigente</div>
                        {rules.length > 0 ? (
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                                    ${Number(rules[0].baseValue).toLocaleString('es-AR')}
                                    <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem', opacity: 0.6 }}>/ {rules[0].baseCalculation}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.7 }}>
                                    Desde: {new Date(rules[0].validFrom).toLocaleDateString()}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sin tarifa pactada aún.</div>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Historial y Condicionales</div>
                        {rules.length > 0 ? (
                            rules.map((r, i) => (
                                <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <span>${Number(r.baseValue).toLocaleString()} ({r.baseCalculation})</span>
                                            <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{new Date(r.validFrom).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.2rem' }}>
                                            {r.conditionals?.espera_hora > 0 && `● Espera: $${r.conditionals.espera_hora}/h `}
                                            {r.conditionals?.nocturno_plus > 0 && `● Plus Noct.: $${r.conditionals.nocturno_plus} `}
                                            {!r.conditionals?.espera_hora && !r.conditionals?.nocturno_plus && 'Sin condicionales'}
                                        </div>
                                    </div>
                                    {userRole === 'SUPER_ADMIN' && (
                                        <button
                                            onClick={() => handleDeleteRule(r.id)}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem', marginLeft: '0.5rem', opacity: 0.6 }}
                                            onMouseOver={e => e.currentTarget.style.opacity = "1"}
                                            onMouseOut={e => e.currentTarget.style.opacity = "0.6"}
                                            title="Eliminar registro"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '0.75rem', opacity: 0.3, textAlign: 'center', marginTop: '1rem' }}>No hay registros anteriores.</div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.3rem' }}>💡 ¿Qué implica cambiar la tarifa?</div>
                    Al guardar una nueva tarifa, los viajes anteriores mantienen su precio histórico. El nuevo valor se aplicará <b>únicamente a los viajes que se inicien desde este momento</b>.
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Actualizar Tarifario</h3>
                </div>

                {step === 'FORM' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* SECCIÓN 1: EL CIMIENTO (CÁLCULO BASE) */}
                        <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Calculator size={18} color="var(--accent-blue)" />
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Cálculo Base (El Cimiento)</h4>
                            </div>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1rem' }}>Define la unidad principal de cobro. Es el valor mínimo que se aplicará al viaje.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>Método de Medición</label>
                                    <select
                                        value={newRule.baseCalculation}
                                        onChange={e => setNewRule({ ...newRule, baseCalculation: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                    >
                                        <option value="KM" style={{ background: '#1e293b' }}>Por Kilómetro (GPS)</option>
                                        <option value="FIXED" style={{ background: '#1e293b' }}>Monto Fijo (Por Viaje)</option>
                                        <option value="TON" style={{ background: '#1e293b' }}>Por Tonelada Cargada</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>Valor de la Unidad ($)</label>
                                    <input
                                        type="number"
                                        value={newRule.baseValue}
                                        onChange={e => setNewRule({ ...newRule, baseValue: Number(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: LADRILLOS LÓGICOS (EXTRAS) */}
                        <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <AlertTriangle size={18} color="#f59e0b" />
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>2. Ladrillos Lógicos (Extras Condicionales)</h4>
                            </div>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1rem' }}>Variables que suman dinero extra al cimiento si se cumplen condiciones operativas.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>Plus por Hora de Espera</label>
                                    <input
                                        type="number"
                                        value={newRule.conditionals.espera_hora}
                                        onChange={e => setNewRule({ ...newRule, conditionals: { ...newRule.conditionals, espera_hora: Number(e.target.value) } })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                        placeholder="Valor x Hora"
                                    />
                                    <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>Se aplica después del umbral de espera pactado.</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>Plus Nocturno (Monto Fijo)</label>
                                    <input
                                        type="number"
                                        value={newRule.conditionals.nocturno_plus}
                                        onChange={e => setNewRule({ ...newRule, conditionals: { ...newRule.conditionals, nocturno_plus: Number(e.target.value) } })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                        placeholder="Monto adicional"
                                    />
                                    <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>Si el viaje ocurre entre 22hs y 06hs.</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '1rem', fontWeight: 800 }}>CERRAR SIN CAMBIOS</button>
                            <button
                                className="btn-primary"
                                disabled={loading}
                                onClick={handleSimulate}
                                style={{ flex: 2, padding: '1rem', fontWeight: 800, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
                            >
                                {loading ? 'Analizando...' : <>INICIAR PROTOCOLO DE SIMULACIÓN <TrendingUp size={20} /></>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>Protocolo de Doble Chequeo</div>

                            {simulation?.viajesAnalizados > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>FACTURACIÓN ANTERIOR (10v)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>${simulation.anteriorTotal.toLocaleString('es-AR')}</div>
                                    </div>
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: '0.7rem' }}>FACTURACIÓN PROYECTADA (10v)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: simulation.impactoPorcentaje > 0 ? 'var(--success-green)' : '#f87171' }}>
                                            ${simulation.nuevoTotal.toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem' }}>No hay viajes previos suficientes para una simulación precisa.</div>
                            )}

                            {simulation?.impactoPorcentaje !== undefined && simulation?.impactoPorcentaje !== null && simulation?.impactoPorcentaje !== 0 && (
                                <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                    Impacto en Margen: <strong>{Number(simulation.impactoPorcentaje).toFixed(2)}%</strong>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                            <AlertTriangle color="#f59e0b" size={32} />
                            <p style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                                <strong>Confirmación Humana Obligatoria:</strong> Al presionar guardar, esta tarifa se aplicará a todos los viajes que inicien a partir de este momento.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep('FORM')}>Corregir Tarifa</button>
                            <button className="btn-primary" style={{ flex: 2, background: 'var(--success-green)', borderColor: 'var(--success-green)' }} onClick={handleConfirm}>
                                <Save size={18} /> Confirmar y Aplicar Nueva Tarifa
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
