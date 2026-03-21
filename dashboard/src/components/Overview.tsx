import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import VisualHelpCard from './common/VisualHelpCard';
import VisualTourOverlay from './common/VisualTourOverlay';

interface ActiveTrip {
    id: string;
    numeroCP: string;
    choferId: string;
    patente: string;
    estado: string;
    chofer?: string;
    lat: number | null;
    lng: number | null;
    destino?: string;
    horaSalida?: string;
    tsPing: string | null;
    fueraDeRango?: boolean;
}

const alertIcon = (label: string) => L.divIcon({
    className: 'custom-alert-icon',
    html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; white-space: nowrap; margin-bottom: 2px; border: 1px solid white;">
                ${label}
            </div>
            <div style="width: 14px; height: 14px; background: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8); animation: pulse 1.5s infinite;"></div>
        </div>
    `,
    iconSize: [60, 40],
    iconAnchor: [30, 35]
});

const normalIcon = (label: string) => L.divIcon({
    className: 'custom-normal-icon',
    html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; white-space: nowrap; margin-bottom: 2px; border: 1px solid white;">
                ${label}
            </div>
            <div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);"></div>
        </div>
    `,
    iconSize: [60, 40],
    iconAnchor: [30, 32]
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
}

interface OverviewProps {
    activeTrips: ActiveTrip[];
    stats: { active: number; audits: number; delayed: number };
}

export default function Overview({ activeTrips = [], stats }: OverviewProps) {
    const [showTour, setShowTour] = useState(false);
    const firstWithCoords = activeTrips.find(t => t.lat && t.lng);
    const center: [number, number] = firstWithCoords
        ? [firstWithCoords.lat!, firstWithCoords.lng!]
        : [-34.6037, -58.3816];

    const tourSteps = [
        { elementId: 'tour-overview-welcome', title: 'Centro de Control', content: 'Acá tenés la vista global de toda tu flota operando en este momento.', position: 'bottom' as const },
        { elementId: 'tour-overview-map', title: 'Mapa Logístico', content: 'Cada punto es un camión real. Podés hacer clic en ellos para ver qué carga llevan y quién es el chofer.', position: 'right' as const },
        { elementId: 'tour-overview-stats', title: 'Números del Día', content: 'Acá ves rápidamente cuántos viajes tenés activos y si hay auditorías pendientes de revisión.', position: 'left' as const }
    ];

    return (
        <div style={{ padding: 'clamp(1rem, 2vw, 2.5rem)', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>

            <div id="tour-overview-welcome">
                <VisualHelpCard
                    sectionId="overview"
                    title="Bienvenido a tu Centro de Control"
                    onStartTour={() => setShowTour(true)}
                    description="Desde acá podés ver dónde están todos tus camiones en tiempo real y cómo viene la operación del día de un solo vistazo."
                    concepts={[
                        { term: "Mapa en Vivo", explanation: "Los puntos azules son tus camiones moviéndose ahora mismo." },
                        { term: "Fuera de Rango", explanation: "Ocurre cuando un camión frena en un lugar no seguro o se desvía de la ruta." },
                        { term: "Resumen Real-Time", explanation: "A la derecha tenés los números rápidos: viajes hoy y tareas pendientes." }
                    ]}
                    steps={[
                        "Mirá el mapa para ubicar a la flota.",
                        "Hacé clic en un camión para ver el detalle del viaje.",
                        "Revisá los contadores de la derecha para ver si hay algo urgente."
                    ]}
                />
            </div>

            {!stats ? (
                <div className="overview-content-layout" style={{ display: 'flex', flex: 1, gap: '1.5rem', position: 'relative', minHeight: '500px' }}>
                    <div className="skeleton" style={{ flex: 1, borderRadius: '1.5rem', height: '100%' }}></div>
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }}></div>
                        <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }}></div>
                        <div className="skeleton" style={{ height: '60px', borderRadius: '16px', marginTop: 'auto' }}></div>
                    </div>
                </div>
            ) : (
                <div className="overview-content-layout" style={{ display: 'flex', flex: 1, gap: '1.5rem', position: 'relative', minHeight: '500px' }}>
                    <style>{`
                        .overview-content-layout { flex-direction: row; height: calc(100vh - 250px); }
                        .overview-stats-panel { width: 300px; height: fit-content; }
                        
                        @media (max-width: 1024px) {
                            .overview-content-layout { flex-direction: column; height: auto; }
                            .map-container { height: 400px !important; flex: none !important; }
                            .overview-stats-panel { width: 100% !important; }
                        }
                    `}</style>
                    <div id="tour-overview-map" className="map-container" style={{ flex: 1, background: '#111', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <MapContainer
                            center={center}
                            zoom={firstWithCoords ? 10 : 12}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {firstWithCoords && <RecenterMap lat={Number(firstWithCoords.lat)} lng={Number(firstWithCoords.lng)} />}
                            {activeTrips && activeTrips.length > 0 && activeTrips.map(trip => {
                                const position: [number, number] = [Number(trip.lat), Number(trip.lng)];
                                if (isNaN(position[0]) || isNaN(position[1])) return null;

                                return (
                                    <Marker
                                        key={trip.id}
                                        position={position}
                                        icon={trip.fueraDeRango ? alertIcon(trip.numeroCP?.split('-')[1] || trip.numeroCP) : normalIcon(trip.numeroCP?.split('-')[1] || trip.numeroCP)}
                                    >
                                        <Popup>
                                            <div style={{ color: '#0f172a', minWidth: '180px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: trip.fueraDeRango ? '#ef4444' : '#22c55e' }}></div>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{trip.numeroCP} | {trip.patente}</h3>
                                                </div>

                                                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                                    <p style={{ margin: '4px 0', fontSize: '0.75rem', opacity: 0.8 }}>📍 Destino: <b style={{ color: '#1e293b' }}>{trip.destino}</b></p>
                                                    <p style={{ margin: '4px 0', fontSize: '0.75rem', opacity: 0.8 }}>🕒 Salida: <b>{trip.horaSalida ? new Date(trip.horaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} hs</b></p>
                                                </div>

                                                <div style={{ marginTop: '0.5rem' }}>
                                                    {trip.fueraDeRango && (
                                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                                                            ⚠️ FUERA DE RANGO
                                                        </div>
                                                    )}
                                                    <p style={{ margin: '4px 0', fontSize: '0.75rem', opacity: 0.7 }}>Chofer: <b>{trip.chofer || 'Desconocido'}</b></p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Estado: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{trip.estado}</span></p>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                        <style>{`
                            @keyframes pulse {
                                0% { transform: scale(0.95); opacity: 1; }
                                50% { transform: scale(1.1); opacity: 0.8; }
                                100% { transform: scale(0.95); opacity: 1; }
                            }
                        `}</style>
                    </div>

                    <div id="tour-overview-stats" className="glass-panel overview-stats-panel" style={{ padding: '2rem', position: 'relative', border: '1px solid var(--glass-border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Resumen Hoy</h2>
                            <Bell size={20} className="text-secondary" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="stat-label" style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 800 }}>VIAJES ACTIVOS</div>
                                <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.25rem' }}>{stats.active || 0}</div>
                            </div>

                            <div className="stat-card" style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                <div className="stat-label" style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 800 }}>AUDITORÍAS PENDIENTES</div>
                                <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.25rem', color: 'var(--accent-blue)' }}>{stats.audits || 0}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                            <button className="btn-primary" style={{
                                width: '100%',
                                padding: '1.25rem',
                                borderRadius: '16px',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                            }}>
                                DESCARGAR REPORTE DIARIO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTour && (
                <VisualTourOverlay
                    steps={tourSteps}
                    onClose={() => setShowTour(false)}
                />
            )}
        </div>
    );
}
