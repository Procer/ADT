import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

interface TourStep {
    elementId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface VisualTourOverlayProps {
    steps: TourStep[];
    onClose: () => void;
}

export default function VisualTourOverlay({ steps, onClose }: VisualTourOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const updateStep = (index: number) => {
        const step = steps[index];
        const element = document.getElementById(step.elementId);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Esperar un poquito a que termine el scroll
            setTimeout(() => {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
                setCurrentStep(index);
                setIsVisible(true);
            }, 500);
        } else {
            console.warn(`Tour element #${step.elementId} not found`);
            // Si no está, saltar al siguiente o cerrar si es el último
            if (index < steps.length - 1) updateStep(index + 1);
            else onClose();
        }
    };

    useEffect(() => {
        updateStep(0);
        // Deshabilitar scroll del cuerpo mientras el tour está activo
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Recalcular posición si la ventana cambia de tamaño
    useEffect(() => {
        const handleResize = () => {
            const element = document.getElementById(steps[currentStep].elementId);
            if (element) setTargetRect(element.getBoundingClientRect());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [currentStep]);

    if (!targetRect) return null;

    const currentStepData = steps[currentStep];
    const { top, left, width, height } = targetRect;

    // Calculamos el clip-path para el "agujero"
    // Es un polígono que rodea la pantalla y luego entra para rodear el elemento (mecanismo par-impar)
    const padding = 6;
    const clipPath = `polygon(
        0% 0%, 
        0% 100%, 
        ${left - padding}px 100%, 
        ${left - padding}px ${top - padding}px, 
        ${left + width + padding}px ${top - padding}px, 
        ${left + width + padding}px ${top + height + padding}px, 
        ${left - padding}px ${top + height + padding}px, 
        ${left - padding}px 100%, 
        100% 100%, 
        100% 0%
    )`;

    // Estilos del globo de ayuda
    const getTooltipStyle = (): React.CSSProperties => {
        const gap = 20;
        const pos = currentStepData.position || 'bottom';

        const style: React.CSSProperties = {
            position: 'fixed',
            zIndex: 10001,
            transition: 'all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            width: '320px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)'
        };

        if (pos === 'bottom') {
            style.top = top + height + gap;
            style.left = Math.max(20, Math.min(window.innerWidth - 340, left + width / 2 - 160));
        } else if (pos === 'top') {
            style.top = top - gap - 220; // Ajuste para altura variable
            style.left = Math.max(20, Math.min(window.innerWidth - 340, left + width / 2 - 160));
        } else if (pos === 'left') {
            style.top = top + height / 2 - 100;
            style.left = left - gap - 340;
        } else if (pos === 'right') {
            style.top = top + height / 2 - 100;
            style.left = left + width + gap;
        }

        return style;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
            {/* El Oscurecimiento con AGUJERO REAL (Sharp Hole) */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto',
                clipPath: clipPath,
                transition: 'clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />

            {/* El Borde Brillante (Spotlight) */}
            <div style={{
                position: 'fixed',
                top: top - padding,
                left: left - padding,
                width: width + (padding * 2),
                height: height + (padding * 2),
                border: '2px solid var(--accent-blue)',
                borderRadius: '12px',
                boxShadow: '0 0 0 4px rgba(56, 189, 248, 0.2), 0 0 25px rgba(56, 189, 248, 0.6)',
                zIndex: 10002,
                pointerEvents: 'none',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />

            {/* El Globo de Ayuda */}
            <div ref={tooltipRef} style={getTooltipStyle()} className="glass-panel">
                <div style={{ padding: '1.5rem', pointerEvents: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: 'var(--accent-blue)', padding: '4px', borderRadius: '6px' }}>
                                <PlayCircle size={14} color="white" />
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, letterSpacing: '0.1em' }}>GUÍA PASO {currentStep + 1}</span>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>
                            <X size={18} />
                        </button>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>{currentStepData.title}</h4>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1.5rem', lineHeight: '1.5' }}>{currentStepData.content}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {steps.map((_, i) => (
                                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentStep ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)' }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {currentStep > 0 && (
                                <button
                                    onClick={() => updateStep(currentStep - 1)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <button
                                onClick={() => currentStep < steps.length - 1 ? updateStep(currentStep + 1) : onClose()}
                                className="btn-primary"
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {currentStep < steps.length - 1 ? 'Siguiente' : 'Terminar'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flechita del globo */}
                <div style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '10px solid rgba(15, 23, 42, 0.9)'
                }} />
            </div>

            <style>{`
                @keyframes spotlight-in {
                    from { transform: scale(1.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
