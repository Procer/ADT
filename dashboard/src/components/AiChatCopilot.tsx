import { API_BASE_URL } from '../config';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, Send, X, Minimize2, Maximize2, TrendingUp, Sparkles } from 'lucide-react';
import VisualHelpCard from './common/VisualHelpCard';



export default function AiChatCopilot({ tenantId }: { tenantId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; proposal?: any; data?: any[] }[]>([
        { role: 'ai', content: 'Hola, soy tu Arquitecto Financiero de ADT. ¿En qué puedo ayudarte hoy con la rentabilidad de tu flota?' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages((prev: any[]) => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${API_BASE_URL}/management/ai/copilot`, {
                userInput: userMsg,
                tenantId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages((prev: any[]) => [...prev, {
                role: 'ai',
                content: res.data.message || 'Entendido. He procesado tu solicitud.',
                proposal: res.data.proposal,
                data: res.data.data
            }]);
        } catch (err) {
            setMessages((prev: any[]) => [...prev, { role: 'ai', content: 'Lo siento, tuve un problema al procesar esa solicitud financiera.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)', zIndex: 9999 }}
        >
            <Sparkles size={24} />
        </button>
    );

    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', width: '380px',
            height: isMinimized ? '60px' : '550px',
            background: '#1e293b', borderRadius: '20px', border: '1px solid var(--accent-blue)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 9999,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transition: 'height 0.3s'
        }}>
            {/* Header */}
            <div style={{ padding: '1rem', background: 'var(--accent-blue)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={20} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ADT COPILOT FINANCIERO</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Chat Area */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <VisualHelpCard
                            sectionId="copilot"
                            title="Tu Asistente ADT"
                            description="Hola! Soy tu asistente inteligente. Podés hacerme preguntas sobre tus finanzas, viajes o clientes simplemente escribiendo acá abajo."
                            steps={[
                                "Escribí tu duda (ej: ¿Cómo vienen las ganancias?)",
                                "Tocá el botón de enviar o apretá Enter.",
                                "Podés pedirme que haga cambios (ej: Subí 10% las tarifas)."
                            ]}
                        />
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%', padding: '0.8rem', borderRadius: '12px',
                                background: m.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                fontSize: '0.85rem', lineHeight: '1.4', border: m.role === 'user' ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)'
                            }}>
                                {m.content}

                                {m.data && m.data.length > 0 && (
                                    <div style={{ marginTop: '0.8rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.5rem' }}>
                                        <table style={{ width: '100%', fontSize: '0.65rem', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    {Object.keys(m.data[0]).map(k => (
                                                        <th key={k} style={{ textAlign: 'left', padding: '0.3rem', opacity: 0.5 }}>{k}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {m.data.slice(0, 5).map((row, idx) => (
                                                    <tr key={idx}>
                                                        {Object.values(row).map((val: any, idx2) => (
                                                            <td key={idx2} style={{ padding: '0.3rem' }}>{val?.toString() || '-'}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {m.data.length > 5 && <div style={{ fontSize: '0.55rem', padding: '0.3rem', opacity: 0.4 }}>+ {m.data.length - 5} filas más...</div>}
                                    </div>
                                )}

                                {m.proposal && (
                                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent-blue)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--accent-blue)' }}>PROPUESTA DE TARIFA</div>
                                        <div style={{ fontSize: '0.75rem' }}>Base: {m.proposal.baseCalculation} | Valor: ${m.proposal.baseValue}</div>
                                        <button
                                            className="btn-primary"
                                            style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', fontSize: '0.7rem' }}
                                            onClick={() => window.alert('Abriendo simulador...')}
                                        >
                                            <TrendingUp size={12} /> Ver Impacto
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && <div style={{ opacity: 0.5, fontSize: '0.75rem' }}>Analizando mercado y márgenes...</div>}
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
                        {[
                            '¿Margen del mes?',
                            'Aumentar 5% a Molinos',
                            'Ranking de Choferes',
                            'Pendientes de pago'
                        ].map(suggestion => (
                            <button
                                key={suggestion}
                                onClick={() => { setInput(suggestion); }}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '20px',
                                    color: '#60a5fa',
                                    fontSize: '0.7rem',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            placeholder="Ej: 'Aumentá un 5% el km de Molinos'"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.8rem' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
