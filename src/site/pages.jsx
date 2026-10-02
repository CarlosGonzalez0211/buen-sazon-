import { Link, Navigate, useParams } from 'react-router-dom';
import { brand, getLocation, hoursText, locations } from './data';
import { Arrow, Btn, Reveal, Status } from './ui';
import { LocationCards } from './Home';
import { photos } from './photos';

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
                                <Link to={`/sucursales/${l.slug}#menu`} className="mesa__row">
                                    <span className="mesa__n">0{i + 1}</span>
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
    if (!l) return <Navigate to="/sucursales/tecnologico" replace />;
    const i = locations.indexOf(l);
    const mapHref = l.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}` : null;

    return (
        <main>
            <section className="page-hero">
                <div className="wrap">
                    <p className="crumb"><Link to="/">Inicio</Link> / Sucursales / {l.name}</p>
                    <h1 className="h1"><em>Sucursal 0{i + 1}</em><br />{l.name}</h1>
                    <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Status />
                        <span className="crumb">{l.zone}</span>
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="info">
                        <Reveal className="info__cell">
                            <h3>Dirección</h3>
                            {l.address ? <p>{l.address}</p> : <p className="pending">Próximamente</p>}
                            {mapHref && <Btn href={mapHref} tone="ghost" small>Cómo llegar</Btn>}
                        </Reveal>
                        <Reveal delay={80} className="info__cell">
                            <h3>Horario</h3>
                            <ul>{hoursText.map((h) => <li key={h.days}>{h.days}<small>{h.time}</small></li>)}</ul>
                        </Reveal>
                        <Reveal delay={160} className="info__cell">
                            <h3>Contacto y servicios</h3>
                            <p><a href={`tel:+52${l.phone.replace(/\s/g, '')}`}>{l.phone}</a></p>
                            <ul>{l.services.map((s) => <li key={s} style={{ fontSize: '1rem', fontWeight: 500 }}>{s}</li>)}</ul>
                        </Reveal>
                    </div>

                    <Reveal className="slot" id="menu">
                        <span className="eyebrow">Menú · {l.name}</span>
                        <h2 className="h2">El menú de esta sucursal <em>va aquí.</em></h2>
                        <p className="lede">Aquí se mostrarán los platillos y precios de la sucursal {l.name}. Mientras tanto, pídenos el menú por WhatsApp.</p>
                        <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Btn href={brand.whatsapp}>Pedir por WhatsApp</Btn>
                            {l.uberEats
                                ? <Btn href={l.uberEats} tone="ghost">Pedir en Uber Eats</Btn>
                                : <span className="btn btn--sm btn--off btn--off-dark" aria-disabled="true">Uber Eats · pronto</span>}
                        </div>
                    </Reveal>

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
                        <span className="eyebrow">Salón de eventos</span>
                        <h1 className="h1">Salón <em>Boho</em></h1>
                        <p className="lede">El salón de eventos de El Buen Sazón. Celebra con nosotros y deja la comida en manos de quien sabe.</p>
                        <div style={{ marginTop: '2rem' }}><Btn href={brand.whatsapp} tone="light">Cotizar mi evento</Btn></div>
                    </div>
                    <div className="boho__art">
                        <div className="arch"><div><span><b>Salón<br /><em>Boho</em></b><small>Eventos · Ciudad Juárez</small></span></div></div>
                    </div>
                </div>
            </section>
            <section className="section">
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
                        <h2 className="h2">Capacidad, paquetes y fechas <em>por WhatsApp.</em></h2>
                        <p className="lede">Cuéntanos tu evento y te respondemos con disponibilidad y cotización.</p>
                        <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Btn href={brand.whatsapp}>Cotizar mi evento</Btn>
                            <Btn href={brand.phoneHref} tone="ghost">Llamar al {brand.phone}</Btn>
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
                    <Status />
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="contact">
                        <Reveal as="div"><a className="big" href={brand.whatsapp} target="_blank" rel="noreferrer"><span>WhatsApp · pedidos</span><b>{brand.phone}</b></a></Reveal>
                        <Reveal as="div" delay={80}><a className="big alt" href={brand.phoneHref}><span>Llamar</span><b>{brand.phone}</b></a></Reveal>
                        <Reveal as="div" delay={120}><a className="big alt" href={`mailto:${brand.email}`}><span>Correo</span><b>{brand.email}</b></a></Reveal>
                        <Reveal as="div" delay={160}><a className="big" href={brand.facebook} target="_blank" rel="noreferrer"><span>Facebook</span><b>/elbuensazonjuarez <Arrow /></b></a></Reveal>
                    </div>
                    <div className="info" style={{ marginTop: '1rem' }}>
                        <div className="info__cell"><h3>Horario</h3><ul>{hoursText.map((h) => <li key={h.days}>{h.days}<small>{h.time}</small></li>)}</ul></div>
                        {locations.map((l) => (
                            <div className="info__cell" key={l.slug}>
                                <h3>{l.name}</h3>
                                {l.address ? <p>{l.address}</p> : <p className="pending">Dirección próximamente</p>}
                                <Link to={`/sucursales/${l.slug}`} className="accent">Ver sucursal →</Link>
                            </div>
                        )).slice(0, 2)}
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
