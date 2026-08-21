import { useState } from 'react';
import DishIllustration from '../components/DishIllustration';
import './Gallery.css';

const allPhotos = [
    { type: 'taco', alt: 'Tacos al Pastor', category: 'food', span: 'wide' },
    { type: 'burrito', alt: 'Burrito mexicano', category: 'food' },
    { type: 'torta', alt: 'Torta de carnitas', category: 'food' },
    { type: 'enchiladas', alt: 'Enchiladas verdes', category: 'restaurant', span: 'tall' },
    { type: 'quesadilla', alt: 'Quesadilla', category: 'food' },
    { type: 'flauta', alt: 'Flautas doradas', category: 'food' },
    { type: 'elote', alt: 'Elote asado', category: 'food' },
    { type: 'tamal', alt: 'Tamal casero', category: 'restaurant' },
    { type: 'agua-jamaica', alt: 'Agua de Jamaica', category: 'drinks' },
    { type: 'agua-horchata', alt: 'Agua de Horchata', category: 'drinks' },
    { type: 'agua-tamarindo', alt: 'Agua de Tamarindo', category: 'drinks' },
    { type: 'agua-sandia', alt: 'Agua de Sandía', category: 'drinks' },
    { type: 'refresco', alt: 'Refresco frío', category: 'drinks' },
];

const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'food', label: '🌮 Comida' },
    { id: 'drinks', label: '🥤 Bebidas' },
    { id: 'restaurant', label: '🏠 Restaurante' },
];

export default function Gallery() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [lightbox, setLightbox] = useState(null);

    const filtered = activeFilter === 'all' ? allPhotos : allPhotos.filter(p => p.category === activeFilter);

    return (
        <main className="page-wrapper">
            <div className="page-hero">
                <div className="container">
                    <p className="section-label">Galería</p>
                    <h1 className="section-title">Nuestros <span>Momentos</span></h1>
                    <div className="divider" />
                    <p className="section-subtitle">
                        Cada platillo cuenta la historia del sabor auténtico de El Buen Sazón.
                    </p>
                </div>
            </div>

            <div className="page-content section">
                <div className="container">
                    {/* Filter Tabs */}
                    <div className="gallery__filters">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`gallery__filter-btn ${activeFilter === cat.id ? 'gallery__filter-btn--active' : ''}`}
                                onClick={() => setActiveFilter(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Masonry Grid */}
                    <div className="gallery__grid">
                        {filtered.map((photo, i) => (
                            <div
                                key={i}
                                className={`gallery__item ${photo.span === 'wide' ? 'gallery__item--wide' : ''} ${photo.span === 'tall' ? 'gallery__item--tall' : ''}`}
                                onClick={() => setLightbox(photo)}
                            >
                                <DishIllustration type={photo.type} title={photo.alt} className="gallery__item-art" />
                                <div className="gallery__item-overlay">
                                    <span className="gallery__item-icon">🔍</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div className="gallery__lightbox" onClick={() => setLightbox(null)}>
                    <div className="gallery__lightbox-inner" onClick={e => e.stopPropagation()}>
                        <button className="gallery__lightbox-close" onClick={() => setLightbox(null)} aria-label="Cerrar">✕</button>
                        <DishIllustration type={lightbox.type} title={lightbox.alt} className="gallery__lightbox-art" />
                        <p className="gallery__lightbox-caption">{lightbox.alt}</p>
                    </div>
                </div>
            )}
        </main>
    );
}
