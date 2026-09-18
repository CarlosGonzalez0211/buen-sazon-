import './MapCard.css';

// Static Google Maps embeds require real place data we don't have for this
// fictional address, and silently render broken. A directions link works
// with any address, no API key, and never fails.
export default function MapCard({ name, address, height = 200 }) {
    const query = encodeURIComponent(name ? `${name}, ${address}` : address);
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    return (
        <div className="map-card" style={{ '--map-card-height': `${height}px` }}>
            <div className="map-card__preview">
                <div className="map-card__pin">📍</div>
                <p className="map-card__addr">{address}</p>
            </div>
            <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-card__btn"
            >
                🧭 Cómo llegar
            </a>
        </div>
    );
}
