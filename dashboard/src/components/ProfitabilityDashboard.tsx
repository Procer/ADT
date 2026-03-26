import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Download, Users } from 'lucide-react';
import VisualHelpCard from './common/VisualHelpCard';
import VisualTourOverlay from './common/VisualTourOverlay';



export default function ProfitabilityDashboard({ tenantId }: { tenantId: string | null }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            setError(null);

            // Calcular rango de fechas (mes completo)
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_BASE_URL}/finance-v3/dashboard-kpis`, {
                params: {
                    tenantId,
                    start: startDate,
                    end: endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && typeof res.data === 'object') {
                setStats(res.data);
            } else {
                setError('El servidor devolvió un formato de datos inesperado.');
            }
        } catch (err: any) {
            console.error('Error fetching profitability stats', err);
            setError(err.response?.data?.message || 'Error al conectar con el servidor de finanzas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tenantId, month, year]);

    const handleExportPdf = async () => {
        if (!tenantId || !stats) return;
        try {
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
            const token = localStorage.getItem('admin_token');

            const res = await axios.get(`${API_BASE_URL}/finance-v3/profitability/export-pdf`, {
                params: { tenantId, start: startDate, end: endDate },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rentabilidad_${months[month - 1]}_${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error exporting PDF', err);
            alert('Error al exportar el reporte PDF.');
        }
    };

    if (!tenantId) return <div className="glass-panel" style={{ padding: '2rem', margin: '2rem', textAlign: 'center' }}>Seleccione una empresa para ver el análisis de rentabilidad.</div>;

    if (loading) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="animate-spin" style={{ display: 'inline-block', width: '3rem', height: '3rem', border: '4px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }}></div>
            <p style={{ opacity: 0.6 }}>Analizando flujos financieros...</p>
        </div>
    );

    if (error) return (
        <div className="glass-panel" style={{ padding: '3rem', margin: '2rem', textAlign: 'center', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
            <div style={{ color: '#f87171', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{error}</div>
            <button onClick={fetchData} className="btn-primary" style={{ padding: '0.6rem 2rem' }}>REINTENTAR</button>
        </div>
    );

    const kpis = [
        {
            label: 'Ingresos Brutos',
            value: stats?.ingresoBruto,
            icon: TrendingUp,
            color: 'var(--accent-blue)',
            detail: `${stats?.totalViajes} viajes (${stats?.newTripsCount} nuevos + ${stats?.creditTripsCount} vales)`
        },
        {
            label: 'Costo Operativo',
            value: stats?.costoOperativo,
            icon: BarChart3,
            color: '#f87171',
            detail: `Chofer: $${stats?.breakdown?.driverPayouts?.toLocaleString()} | ADT: $${stats?.breakdown?.platformFees?.toLocaleString()} | Upcharge: $${stats?.upcharges?.toLocaleString()}`
        },
        { label: 'Margen Neto', value: stats?.margenNeto, icon: TrendingUp, color: 'var(--success-green)', detail: `${stats?.ingresoBruto > 0 ? (stats?.margenNeto / stats?.ingresoBruto * 100).toFixed(1) : 0}% de rentabilidad` },
    ];

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const years = [2024, 2025, 2026];

    const isMobile = windowWidth < 768;

    return (
        <div style={{ padding: 'max(1rem, 2vw)' }}>
            <VisualHelpCard
                sectionId="rentabilidad"
                title="Rentabilidad Neta"
                onStartTour={() => setShowTour(true)}
                description="Acá ves la 'verdad' de tu negocio. El sistema calcula cuánto dinero te queda limpio después de pagarle a los choferes y pagar los costos de ADT."
                concepts={[
                    { term: "Ingresos Brutos", explanation: "Es todo lo que les vas a cobrar a tus clientes (Dadores)." },
                    { term: "Costo Operativo", explanation: "Es la plata que 'sale' (lo que le pagás al chofer y a ADT)." },
                    { term: "Margen Neto", explanation: "Es tu ganancia real. Lo que te queda en el bolsillo al final del día." }
                ]}
                steps={[
                    "Elegí el mes y año que querés analizar arriba a la derecha.",
                    "Mirá el 'Margen Neto' para ver si el negocio está siendo rentable.",
                    "Revisá la tabla de abajo para ver qué cliente te deja más ganancia."
                ]}
                tips={[
                    "Un margen verde es buena señal. Si ves márgenes muy bajos (rojos), podrías estar cobrando poco o pagando mucho de flete."
                ]}
            />
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '2.5rem',
                gap: '1.5rem'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>Dashboard de Rentabilidad Neta</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Análisis determinístico de ingresos, costos y tasas</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                    <div className="glass-panel" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        flex: 1
                    }}>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 700, padding: '0.5rem', cursor: 'pointer', width: '100%' }}
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1} style={{ background: '#0f172a' }}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 700, padding: '0.5rem', cursor: 'pointer', width: '100%' }}
                        >
                            {years.map(y => (
                                <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div id="tour-profit-kpis" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                {kpis.map((kpi, i) => (
                    <div id={`tour-kpi-${i}`} key={i} className="glass-panel" style={{ padding: '1.5rem', background: i === 3 ? 'rgba(34, 197, 94, 0.05)' : 'var(--glass-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</span>
                            <kpi.icon size={18} style={{ color: kpi.color }} />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: (i === 1 || (i === 3 && kpi.value < 0)) ? '#f87171' : 'inherit' }}>
                            ${Number(kpi.value || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.8 }}>
                            {kpi.detail}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
            }}>
                <div id="tour-profit-clients" className="glass-panel" style={{ padding: '1.5rem', overflowX: 'hidden' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={20} color="var(--accent-blue)" /> Desglose por Cliente / Dador
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', opacity: 0.4, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0.75rem' }}>Cliente (Dador)</th>
                                    <th id="tour-profit-col-trips" style={{ padding: '0.75rem' }}>Viajes (N+V)</th>
                                    <th id="tour-profit-col-rev" style={{ padding: '0.75rem' }}>Ingresos Totales</th>
                                    <th id="tour-profit-col-prof" style={{ padding: '0.75rem' }}>Ganancia Neta</th>
                                    <th id="tour-profit-col-marg" style={{ padding: '0.75rem' }}>Margen (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(stats?.byClient || {}).map(([name, data]: [string, any]) => (
                                    <tr key={name} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {data.trips} <span style={{ opacity: 0.5, fontSize: '0.8em' }}>({data.newTrips}+{data.creditTrips})</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>${data.revenue.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: data.profit < 0 ? '#f87171' : 'var(--success-green)', fontWeight: 700 }}>
                                            ${data.profit.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.min(100, Math.max(0, data.margin))}%`,
                                                        height: '100%',
                                                        background: data.margin < 10 ? '#f87171' : 'var(--success-green)'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{data.margin}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="tour-profit-summary" className="glass-panel" style={{ padding: '1.5rem', background: 'var(--glass-accent)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Resumen del Periodo</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div id="tour-profit-total-performance">
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.25rem' }}>Volumen de Trabajo</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats?.totalViajes} Viajes Realizados</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{stats?.newTripsCount} Nuevos | {stats?.creditTripsCount} con Créditos</div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
                        <div id="tour-profit-ratio">
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.25rem' }}>Porcentaje de Gastos</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                {stats?.ingresoBruto > 0 ? ((stats?.costoOperativo / stats?.ingresoBruto) * 100).toFixed(1) : 0}% de los ingresos
                            </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--glass-border)' }}></div>
                        <button
                            onClick={handleExportPdf}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', fontWeight: 800, border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Download size={16} /> EXPORTAR PDF
                        </button>
                    </div>
                </div>
            </div>
            {showTour && (
                <VisualTourOverlay
                    onClose={() => setShowTour(false)}
                    steps={[
                        {
                            elementId: 'rentabilidad',
                            title: 'Tu Salud Financiera',
                            content: '¡Esta es la pantalla más importante! Aquí vas a saber si tu logística está ganando o perdiendo plata realmente.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-kpi-0',
                            title: 'Ingreso Bruto',
                            content: 'Es el dinero TOTAL que tus clientes te deben por los fletes. Es la "caja" que generaste antes de pagar nada.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-kpi-1',
                            title: 'Costos Directos',
                            content: 'Aquí sumamos lo que le pagás a los choferes y lo que pagás a ADT. Es el gasto necesario para que los camiones se muevan.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-kpi-2',
                            title: 'Margen Neto (Tu Ganancia)',
                            content: '¡El número clave! Es lo que queda en tu bolsillo después de todos los gastos. \nEjemplo: Si cobraste $100 y gastaste $80, tu Margen es de $20.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-col-trips',
                            title: 'Viajes (N+V)',
                            content: 'N = Viajes Nuevos. \nV = Créditos usados de viajes anulados. \nEsta columna te dice el volumen total de trabajo con este cliente.',
                            position: 'right'
                        },
                        {
                            elementId: 'tour-profit-col-rev',
                            title: 'Ingresos Totales',
                            content: 'Es la suma de todo lo facturado a este cliente antes de restar los costos.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-col-prof',
                            title: 'Ganancia Neta',
                            content: 'Es lo que te queda "en mano" después de haber pagado los fletes y costos del sistema. Si está en ROJO, estás perdiendo plata con este dador.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-col-marg',
                            title: 'Margen (%)',
                            content: 'Es el porcentaje de rentabilidad. Un margen de 20% significa que por cada $100 que cobrás, te quedan $20 de ganancia.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-summary',
                            title: 'Resumen del Periodo',
                            content: 'Esta es la foto final de tu mes. Aquí ves el volumen total de trabajo y qué tan eficiente fue el periodo.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-total-performance',
                            title: 'Volumen de Trabajo',
                            content: 'Es la cantidad total de viajes. Te muestra cuántos fueron "Nuevos" (facturación nueva) y cuántos usaron "Créditos" antiguos.',
                            position: 'left'
                        },
                        {
                            elementId: 'tour-profit-ratio',
                            title: 'Porcentaje de Gastos',
                            content: 'Este número te dice qué parte de la plata que entra se va automáticamente para pagar los camiones y el sistema. \n\nEjemplo: Si dice 80%, significa que de cada $100 que cobrás, $80 se van en gastos y solo $20 son ganancia tuya. ¡Cuanto más bajo sea este número, mejor para vos!',
                            position: 'left'
                        }
                    ]}
                />
            )}
        </div>
    );
}
