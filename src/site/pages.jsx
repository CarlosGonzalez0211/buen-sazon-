import { Link, Navigate, useParams } from 'react-router-dom';
import { boho, brand, getLocation, hoursText, locations, telHref, waHref } from './data';
import { Arrow, Btn, OrderButtons, Reveal } from './ui';
import { LocationCards } from './Home';
import { photos } from './photos';
import MenuView from './MenuView';
import { bohoLogo, bohoSalon, bohoSalonAlt } from './bohoAssets';
import { menus } from './menus';

function Switcher({ current, base }) {
    return (
        <div className="switch">
            <span>Otras sucursales:</span>
            {locations.map((l) => (
                <Link key={l.slug} to={`${base}/${l.slug}`} className={l.slug === current ? 'active' : ''}>{l.name}</Link>
            ))}
        </div>
    );
}

/* ── /menu : choose a branch ───────────── */
export function MenuChooser() {
    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <span className="eyebrow">Menú</span>
                    <h1 className="h1">¿Dónde vas <em>a comer?</em></h1>
                    <p className="lede">Cada sucursal tiene su propio menú. Elige la tuya.</p>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="mesa__list">
                        {locations.map((l, i) => (
                            <Reveal key={l.slug} delay={i * 60}>
                                <Link to={`/menu/${l.slug}`} className="mesa__row">
                                    <span className="mesa__n">{i + 1}</span>
                                    <h3>{l.name}</h3>
                                    <p>{l.address ?? 'Dirección próximamente'}</p>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ── /sucursales/:slug ─────────────────── */
export function Branch() {
    const { slug } = useParams();
    const l = getLocation(slug);
    if (!l) return <Navigate to="/sucursales/ramon-rivera-lara" replace />;
    const i = locations.indexOf(l);
    const mapHref = l.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}` : null;

    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <p className="crumb"><Link to="/">Inicio</Link> / Sucursales / {l.name}</p>
                    <h1 className="h1"><em>Sucursal {i + 1}</em><br />{l.name}</h1>
                    <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="crumb">{l.comingSoon ? `Próxima apertura · ${l.zone}` : l.zone}</span>
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    {l.video && (
                        <Reveal className="vframe">
                            <iframe
                                title={`Video de la sucursal ${l.name}`}
                                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(l.video)}&show_text=false&width=1100&t=0`}
                                loading="lazy"
                                scrolling="no"
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </Reveal>
                    )}
                    <div className="info">
                        <Reveal className="info__cell">
                            <h3>Dirección</h3>
                            {l.address ? <p>{l.address}</p> : <p className="pending">Próximamente</p>}
                            {mapHref && <Btn href={mapHref} tone="ghost" small>Cómo llegar</Btn>}
                        </Reveal>
                        <Reveal delay={80} className="info__cell">
                            <h3>Horario</h3>
                            {l.comingSoon
                                ? <p className="pending">Próxima apertura</p>
                                : <ul>{hoursText.map((h) => <li key={h.days}>{h.days}<small>{h.time}</small></li>)}</ul>}
                        </Reveal>
                        <Reveal delay={160} className="info__cell">
                            <h3>Contacto y servicios</h3>
                            {l.phone ? <p><a href={telHref(l)}>{l.phone}</a></p> : <p className="pending">Teléfono próximamente</p>}
                            <ul>{l.services.map((s) => <li key={s} style={{ fontSize: '1rem', fontWeight: 500 }}>{s}</li>)}</ul>
                        </Reveal>
                    </div>

                    {menus[l.slug]
                        ? <MenuView menu={menus[l.slug]} location={l} />
                        : (                    <Reveal className="slot" id="menu">
                            <span className="eyebrow">Menú · {l.name}</span>
                            <h2 className="h2">El menú de esta sucursal <em>va aquí.</em></h2>
                            <p className="lede">Aquí se mostrarán los platillos y precios de la sucursal {l.name}. Muy pronto lo verás aquí.</p>
                            <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}><OrderButtons location={l} /></div>
                        </Reveal>)}

                    {!l.verified && <p className="crumb" style={{ marginTop: '1.2rem' }}>{l.note}</p>}
                    <Switcher current={slug} base="/sucursales" />
                </div>
            </section>
        </main>
    );
}

/* ── /salon-boho ───────────────────────── */
export function Boho() {
    return (
        <main>
            <section className="page-hero boho" style={{ paddingBottom: '6rem' }}>
                <div className="wrap boho__grid">
                    <div>
                        <span className="eyebrow">Salón de eventos y catering</span>
                        <h1 className="h1">Salón <em>Boho</em></h1>
                        <p className="lede">Celebra en un salón con madera, vegetación y luz cálida. Bodas, cumpleaños y reuniones, con servicio de catering.</p>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap' }}>
                            <Btn href={boho.whatsapp} tone="light">Cotizar por WhatsApp</Btn>
                            <Btn href={boho.phoneHref} tone="ghost">Llamar</Btn>
                        </div>
                    </div>
                    <div className="boho__art boho__art--photo">
                        <div className="arch"><div><img src={bohoSalon} alt={bohoSalonAlt} /></div></div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="wrap">
                    <div className="bohoinfo">
                        <Reveal className="bohoinfo__logo">
                            <img src={bohoLogo} alt="Boho, salón de eventos y catering" />
                        </Reveal>
                        <Reveal delay={100} className="bohoinfo__list">
                            <a href={boho.whatsapp} target="_blank" rel="noreferrer"><span>WhatsApp</span><b>+52 1 {boho.phone}</b></a>
                            <a href={boho.phoneHref}><span>Teléfono</span><b>{boho.phone}</b></a>
                            <a href={`mailto:${boho.email}`}><span>Correo</span><b>{boho.email}</b></a>
                            <a href={boho.linktree} target="_blank" rel="noreferrer"><span>Más información</span><b>linktr.ee/salonboho ↗</b></a>
                        </Reveal>
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <Reveal>
                        <span className="eyebrow">Videos</span>
                        <h2 className="h2" style={{ margin: '1rem 0 2.5rem' }}>Conoce el salón <em>por dentro.</em></h2>
                    </Reveal>
                    <div className="vgrid">
                        {[1, 2, 3].map((n) => (
                            <Reveal key={n} delay={n * 70} className="vslot">
                                <div className="vslot__frame vslot__frame--tall">
                                    <span className="vslot__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
                                    <small>Video {n} · próximamente</small>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal className="slot" delay={100}>
                        <span className="eyebrow">Reservaciones</span>
                        <h2 className="h2">Capacidad, paquetes y fechas <em>por mensaje.</em></h2>
                        <p className="lede">Cuéntanos tu evento y te respondemos con disponibilidad y cotización.</p>
                        <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Btn href={boho.whatsapp}>Cotizar mi evento</Btn>
                            <Btn href={boho.phoneHref} tone="ghost">Llamar al {boho.phone}</Btn>
                        </div>
                    </Reveal>
                </div>
            </section>
        </main>
    );
}

/* ── /nosotros ─────────────────────────── */
export function About() {
    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <span className="eyebrow">Nosotros</span>
                    <h1 className="h1">Sabor casero, <em>hecho en Juárez.</em></h1>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="story">
                        <Reveal><h2 className="h2">Cocinamos lo que <em>nos gusta comer.</em></h2></Reveal>
                        <Reveal delay={100} className="story__body">
                            <p>El Buen Sazón es comida mexicana y antojitos con sabor casero: platillos de todos los días, porciones generosas y el trato de siempre.</p>
                            <p>Atendemos en el comedor, llevamos a domicilio y también tenemos un salón de eventos, el Salón Boho, para tus celebraciones.</p>
                            {/* TODO: la historia real (año, fundadores) la confirma el dueño */}
                        </Reveal>
                    </div>
                    <div className="facts">
                        <Reveal className="fact"><b>{brand.recommend}%</b><span>de quienes nos reseñan nos recomienda</span></Reveal>
                        <Reveal delay={80} className="fact"><b>{brand.reviews}</b><span>reseñas en Facebook</span></Reveal>
                        <Reveal delay={160} className="fact"><b>3</b><span>sucursales en Ciudad Juárez</span></Reveal>
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ── /contacto ─────────────────────────── */
export function Contact() {
    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <span className="eyebrow">Contacto</span>
                    <h1 className="h1">Escríbenos, <em>te atendemos.</em></h1>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="info">
                        {locations.map((l, i) => (
                            <Reveal className="info__cell" key={l.slug} delay={i * 70}>
                                <h3>Sucursal {i + 1}</h3>
                                <p style={{ fontSize: '1.5rem', letterSpacing: '-.03em' }}>{l.name}</p>
                                {l.address ? <p style={{ fontWeight: 500, fontSize: '1rem' }}>{l.address}</p> : <p className="pending">Dirección próximamente</p>}
                                {l.phone ? <p><a href={telHref(l)}>{l.phone}</a></p> : <p className="pending">Teléfono próximamente</p>}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.4rem' }}>
                                    {waHref(l) && <Btn href={waHref(l)} small>WhatsApp</Btn>}
                                    <Btn to={`/sucursales/${l.slug}`} tone="ghost" small>Ver sucursal</Btn>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                    <div className="contact" style={{ marginTop: '1rem' }}>
                        <Reveal as="div"><a className="big alt" href={`mailto:${brand.email}`}><span>Correo</span><b>{brand.email}</b></a></Reveal>
                        <Reveal as="div" delay={80}><a className="big" href={brand.facebook} target="_blank" rel="noreferrer"><span>Facebook</span><b>/elbuensazonjuarez <Arrow /></b></a></Reveal>
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ── /sucursales ───────────────────────── */
export function Locations() {
    return (
        <main className="suc suc--flat suc--page">
            <section className="page-hero">
                <div className="wrap">
                    <span className="eyebrow">Sucursales</span>
                    <h1 className="h1">Elige <em>la tuya.</em></h1>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap"><LocationCards /></div>
            </section>
        </main>
    );
}

/* ── /galeria ──────────────────────────── */
const gallery = [
    ['Platillos', [photos.flautasRoja, photos.chuleta, photos.enchiladasRojas, photos.club, photos.fajitas, photos.tacosRoja, photos.ensalada, photos.sopes, photos.gordita, photos.caldo, photos.flautasArroz, photos.carneMolida, photos.tacosMesa, photos.bistec, photos.platoGuisado, photos.platoChile]],
    ['En la mesa', [photos.cafe, photos.tortillas]],
    ['Detrás de la cocina', [photos.cocina1, photos.cocina2, photos.cocina3]],
];

export function Gallery() {
    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <span className="eyebrow">Galería</span>
                    <h1 className="h1">Platillos y <em>ambiente.</em></h1>
                    <p className="lede">Una probadita de lo que sale de nuestra cocina. Más fotos pronto.</p>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    {gallery.map(([title, list]) => (
                        <div key={title} style={{ marginBottom: '4rem' }}>
                            <Reveal><h2 className="gal__title">{title}</h2></Reveal>
                            <div className="gal">
                                {list.map((p, i) => (
                                    <Reveal key={p.src} delay={i * 60} className="gal__item"><img src={p.src} alt={p.alt} loading="lazy" /></Reveal>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

/* ── /menu/:slug : direct menu link (for QR codes) ── */
export function MenuPage() {
    const { slug } = useParams();
    const l = getLocation(slug);
    if (!l) return <Navigate to="/menu" replace />;
    const menu = menus[l.slug];
    return (
        <main>
            <section className="page-hero" style={{ paddingTop: "2.2rem", paddingBottom: 0 }}>
                <div className="wrap">
                    <p className="crumb"><Link to="/">Inicio</Link> / <Link to="/menu">Menú</Link> / {l.name}</p>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    {menu
                        ? <MenuView menu={menu} location={l} />
                        : (
                            <div className="menuv">
                                <Reveal className="slot">
                                    <span className="eyebrow">Menú · {l.name}</span>
                                    <h2 className="h2">El menú de esta sucursal <em>llega pronto.</em></h2>
                                    <p className="lede">Muy pronto podrás ver aquí todos los platillos y precios.</p>
                                    <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}><OrderButtons location={l} /></div>
                                </Reveal>
                            </div>
                        )}
                    <div className="switch">
                        <span>Menú de otra sucursal:</span>
                        {locations.map((x) => <Link key={x.slug} to={`/menu/${x.slug}`} className={x.slug === slug ? 'active' : ''}>{x.name}</Link>)}
                    </div>
                </div>
            </section>
        </main>
    );
}
