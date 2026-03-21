import { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronDown, ChevronUp, CheckCircle2, ChevronRight } from 'lucide-react';

interface VisualHelpCardProps {
    sectionId: string;
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
    concepts?: { term: string; explanation: string }[];
}

export default function VisualHelpCard({
    sectionId,
    title,
    description,
    steps = [],
    tips = [],
    concepts = [],
}: VisualHelpCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const storageKey = `adt_help_disabled_${sectionId}`;

    useEffect(() => {
        const isDisabled = localStorage.getItem(storageKey);
        const isGlobalDisabled = localStorage.getItem('adt_help_global_disabled');

        if (!isDisabled && !isGlobalDisabled) {
            setIsVisible(true);
        }
    }, [storageKey]);

    const handleDismiss = () => {
        localStorage.setItem(storageKey, 'true');
        setIsVisible(false);
    };


    if (!isVisible) return null;

    return (
        <div className="glass-panel help-card-container" style={{
            marginBottom: isExpanded ? '1.5rem' : '0.5rem',
            borderLeft: isExpanded ? '4px solid var(--accent-blue)' : '2px solid rgba(56, 189, 248, 0.3)',
            overflow: 'hidden',
            animation: 'fadeInAiuto 0.5s ease-out',
            background: activeStep !== null ? 'rgba(56, 189, 248, 0.05)' : isExpanded ? 'var(--glass-bg)' : 'transparent',
            transition: 'all 0.4s ease',
            boxShadow: isExpanded ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : 'none'
        }}>
            <div style={{
                padding: isExpanded ? '1rem 1.5rem' : '0.5rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isExpanded ? 'rgba(56, 189, 248, 0.12)' : 'none',
                cursor: 'pointer',
                userSelect: 'none'
            }} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: isExpanded ? 'var(--accent-blue)' : 'rgba(56, 189, 248, 0.1)',
                        padding: '0.4rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isExpanded ? 'white' : 'var(--accent-blue)'
                    }}>
                        <Lightbulb size={isExpanded ? 18 : 14} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: isExpanded ? '1rem' : '0.8rem', fontWeight: 900, margin: 0, color: 'white', opacity: isExpanded ? 1 : 0.7 }}>
                            {isExpanded ? `Guía Interactiva: ${title}` : `${title} (Ayuda)`}
                        </h3>
                        {isExpanded && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Leé los pasos para dominar esta sección</div>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isExpanded ? <ChevronUp size={18} opacity={0.5} /> : <ChevronDown size={14} opacity={0.4} />}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem', borderRadius: '6px', opacity: 0.3 }}
                    >
                        <X size={isExpanded ? 18 : 14} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <p style={{ opacity: 0.9, fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6', color: '#e2e8f0', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                        {description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: '2rem' }}>

                        {/* Lado izquierdo: Pasos con animación */}
                        <div style={{ flex: 1.5 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Pasos de la Guía</span>
                                {activeStep !== null && <span>{activeStep + 1} de {steps.length}</span>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {steps.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setActiveStep(i)}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            background: activeStep === i ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${activeStep === i ? 'var(--accent-blue)' : 'transparent'}`,
                                            cursor: 'pointer',
                                            transform: activeStep === i ? 'scale(1.02)' : 'scale(1)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            opacity: activeStep !== null && activeStep !== i ? 0.4 : 1
                                        }}
                                    >
                                        <div style={{
                                            minWidth: '28px',
                                            height: '28px',
                                            borderRadius: '10px',
                                            background: activeStep === i ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.9rem',
                                            fontWeight: 950
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: activeStep === i ? 700 : 400, color: 'white' }}>{s}</p>
                                        </div>
                                        {activeStep === i && (
                                            <div className="arrow-indicator" style={{ animation: 'moveRight 1s infinite' }}>
                                                <ChevronRight size={20} color="var(--accent-blue)" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {activeStep !== null && (
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                    <button
                                        disabled={activeStep === 0}
                                        onClick={() => setActiveStep(activeStep - 1)}
                                        className="btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', opacity: activeStep === 0 ? 0.3 : 1 }}
                                    >
                                        Paso Anterior
                                    </button>
                                    <button
                                        onClick={() => activeStep < steps.length - 1 ? setActiveStep(activeStep + 1) : setActiveStep(null)}
                                        className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                                    >
                                        {activeStep < steps.length - 1 ? 'Siguiente Paso' : 'Finalizar Guía'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Lado derecho: Conceptos y Tips */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {concepts.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', marginBottom: '1rem' }}>Diccionario Rápido</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {concepts.map((c, i) => (
                                            <div key={i} style={{ padding: '0.75rem 1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', borderLeft: '2px solid var(--accent-blue)' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.2rem' }}>{c.term}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{c.explanation}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tips.length > 0 && (
                                <div style={{ padding: '1.25rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '16px', border: '1px dashed rgba(34, 197, 94, 0.3)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-green)' }}>
                                        <CheckCircle2 size={18} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Tip de Experto</span>
                                    </div>
                                    {tips.map((t, i) => (
                                        <p key={i} style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4' }}>{t}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        <button
                            onClick={handleDismiss}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            No volver a mostrar esta ayuda en {title}
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInAiuto {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounceX {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(5px); }
                }
                @keyframes moveRight {
                    0% { transform: translateX(0); opacity: 0.5; }
                    50% { transform: translateX(5px); opacity: 1; }
                    100% { transform: translateX(0); opacity: 0.5; }
                }
                .pulse-icon {
                    animation: pulse-shadow 2s infinite;
                }
                @keyframes pulse-shadow {
                    0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
                }
                .tour-btn:hover {
                    background: #0ea5e9 !important;
                    transform: scale(1.05);
                }
            `}} />
        </div>
    );
}
