import { useState } from 'react';
import axios from 'axios';
import { Lock, Mail } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Login({ onLogin }: { onLogin: (user: any, token: string) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
                email,
                pass: password
            });
            onLogin(res.data.user, res.data.access_token);
        } catch (err) {
            setError('Credenciales inválidas o error de servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'radial-gradient(circle at top right, #1e293b, #0f172a)'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>ADT Admin</h1>
                    <p className="text-secondary">Ingrese a su panel de gestión</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Correo Electrónico</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
                                placeholder="admin@adt.com"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
                    >
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
