import React, { useState } from 'react';
import axios from 'axios';
import { useTripStore } from '../store/useTripStore';
import { LogIn, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';


export const Login: React.FC = () => {
    const [dni, setDni] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setUser = useTripStore((state) => state.setUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                dni,
                pin
            });

            const { access_token, driver, tenantConfig } = response.data;
            // Adaptar objeto driver a la interfaz User del store
            const userMapped = {
                userId: driver.id,
                username: driver.nombre,
                role: 'DRIVER',
                tenantId: driver.tenantId
            };
            setUser(userMapped, access_token, tenantConfig);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-white tracking-tighter">ANKA CHOFER</h1>
                    <p className="text-slate-400 mt-2">Acceso con DNI y PIN</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">DNI del Chofer</label>
                        <input
                            type="text"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none transition-all"
                            placeholder="Ingrese su DNI"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">PIN de Seguridad</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none transition-all"
                            placeholder="••••"
                            required
                            maxLength={4}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-xl"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogIn size={20} />
                                <span>ENTRAR AL SISTEMA</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
