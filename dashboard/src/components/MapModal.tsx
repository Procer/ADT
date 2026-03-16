
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapModalProps {
    lat: number;
    lng: number;
    title: string;
    onClose: () => void;
}

export default function MapModal({ lat, lng, title, onClose }: MapModalProps) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="glass-panel" style={{ width: '800px', height: '600px', padding: '0', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5, display: 'flex' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ width: '100%', height: 'calc(100% - 60px)' }}>
                    <MapContainer center={[lat, lng]} zoom={15} style={{ width: '100%', height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lat, lng]}>
                            <Popup>{title}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
