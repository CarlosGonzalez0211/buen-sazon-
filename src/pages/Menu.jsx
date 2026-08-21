import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { locations } from '../data/locations';
import { menus } from '../data/menus';
import DishIllustration, { dishTypeFor } from '../components/DishIllustration';
import './Menu.css';

export default function Menu() {
    const [searchParams] = useSearchParams();
    const [activeLocation, setActiveLocation] = useState('sucursal-1');
    const [activeCategory, setActiveCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const locParam = searchParams.get('location');
        if (locParam && locations.find(l => l.id === locParam && l.status === 'open')) {
            setActiveLocation(locParam);
        }
    }, [searchParams]);

    const openLocations = locations.filter(l => l.status === 'open');
    const currentLocation = locations.find(l => l.id === activeLocation);
    const currentMenu = currentLocation ? menus[currentLocation.menuId] : null;

    useEffect(() => {
        if (currentMenu?.categories?.length) {
            setActiveCategory(currentMenu.categories[0].id);
        }
    }, [activeLocation]);

    const activeCategories = currentMenu?.categories || [];
    const activeCat = activeCategories.find(c => c.id === activeCategory);

    const filteredItems = searchQuery
        ? activeCategories.flatMap(c => c.items).filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : activeCat?.items || [];

    return (
        <main className="page-wrapper">
            {/* Page Hero */}
            <div className="page-hero">
                <div className="container">
                    <p className="section-label">Nuestro Menú</p>
                    <h1 className="section-title">Menú <span>El Buen Sazón</span></h1>
                    <div className="divider" />
                    <p className="section-subtitle">
                        Auténtica comida mexicana preparada con ingredientes frescos y recetas tradicionales.
                    </p>
                </div>
            </div>

            <div className="page-content">
                <div className="container">
                    {/* Location Selector */}
                    <div className="menu__loc-selector">
                        <p className="menu__loc-label">📍 Selecciona tu Sucursal:</p>
                        <div className="menu__loc-tabs">
                            {openLocations.map(loc => (
                                <button
                                    key={loc.id}
                                    className={`menu__loc-tab ${activeLocation === loc.id ? 'menu__loc-tab--active' : ''}`}
                                    onClick={() => { setActiveLocation(loc.id); setSearchQuery(''); }}
                                >
                                    {loc.shortName}
                                    <span className="badge badge-open">Abierto</span>
                                </button>
                            ))}
                            <div className="menu__loc-tab menu__loc-tab--disabled">
                                Norte
                                <span className="badge badge-soon">Próximamente</span>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="menu__search">
                        <input
                            type="text"
                            className="form-input menu__search-input"
                            placeholder="🔍 Busca un platillo..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            aria-label="Buscar platillo"
                        />
                    </div>

                    {currentMenu && !searchQuery && (
                        <div className="menu__layout">
                            {/* Category Sidebar */}
                            <aside className="menu__sidebar">
                                <h3 className="menu__sidebar-title">Categorías</h3>
                                <ul className="menu__cat-list">
                                    {activeCategories.map(cat => (
                                        <li key={cat.id}>
                                            <button
                                                className={`menu__cat-btn ${activeCategory === cat.id ? 'menu__cat-btn--active' : ''}`}
                                                onClick={() => setActiveCategory(cat.id)}
                                            >
                                                <span className="menu__cat-icon">{cat.icon}</span>
                                                <span>{cat.name}</span>
                                                <span className="menu__cat-count">{cat.items.length}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </aside>

                            {/* Items Grid */}
                            <div className="menu__items">
                                <div className="menu__items-header">
                                    <h2 className="menu__items-title">
                                        {activeCat?.icon} {activeCat?.name}
                                    </h2>
                                    <span className="menu__items-count">{activeCat?.items.length} platillos</span>
                                </div>
                                <div className="menu__grid">
                                    {activeCat?.items.map(item => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchQuery && (
                        <div className="menu__search-results">
                            <h3 className="menu__search-heading">
                                {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''} para "{searchQuery}"
                            </h3>
                            <div className="menu__grid">
                                {filteredItems.map(item => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                                {filteredItems.length === 0 && (
                                    <div className="menu__empty">
                                        <p style={{ fontSize: '2rem' }}>🌮</p>
                                        <p>No encontramos ese platillo. ¡Prueba otra búsqueda!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function MenuItemCard({ item }) {
    return (
        <div className={`menu-item-card ${item.popular ? 'menu-item-card--popular' : ''}`}>
            <div className="menu-item-card__img-wrap">
                <DishIllustration type={dishTypeFor(item.id || item.name)} name={item.name} className="menu-item-card__art" title={item.name} />
                {item.popular && <span className="menu-item-card__popular">🔥 Popular</span>}
            </div>
            <div className="menu-item-card__body">
                <h4 className="menu-item-card__name">{item.name}</h4>
                <p className="menu-item-card__desc">{item.description}</p>
                <div className="menu-item-card__footer">
                    <span className="menu-item-card__price">${item.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
