import { useEffect, useState } from 'react';
import { photos } from './photos';
import { OrderButtons, Reveal } from './ui';

const money = (n) => `$${n}`;
const LONG = /^(Agrega|Molletes|Hotcake)/;

export default function MenuView({ menu, location }) {
    const [active, setActive] = useState(menu.sections[0].id);

    useEffect(() => {
        const els = menu.sections.map((s) => document.getElementById(`m-${s.id}`)).filter(Boolean);
        const io = new IntersectionObserver((entries) => {
            const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (hit) setActive(hit.target.id.slice(2));
        }, { rootMargin: '-130px 0px -65% 0px' });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [menu]);


    return (
        <div className="menuv" id="menu">
            <header className="menuv__head">
                <div>
                    <span className="eyebrow">Menú · {location.name}</span>
                    <h2 className="h2" style={{ marginTop: '1rem' }}>Ordena y <em>recoge.</em></h2>
                </div>
                <div className="menuv__order">
                    {location.phone && <p>Pide por WhatsApp o llámanos al <b>{location.phone}</b>.</p>}
                    <div className="menuv__btns"><OrderButtons location={location} /></div>
                </div>
            </header>

            <nav className="menuv__tabs" aria-label="Categorías del menú">
                {menu.sections.map((s) => (
                    <a key={s.id} href={`#m-${s.id}`} className={active === s.id ? 'on' : ''}
                        onClick={(e) => { e.preventDefault(); document.getElementById(`m-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
                        {s.title}
                    </a>
                ))}
            </nav>

            {menu.sections.map((s) => (
                <section key={s.id} id={`m-${s.id}`} className="msec">
                    <Reveal className="msec__head">
                        <h3>{s.title}</h3>
                        {s.photo && <img src={photos[s.photo].src} alt={photos[s.photo].alt} loading="lazy" />}
                    </Reveal>
                    {s.intro && <p className="msec__intro">{s.intro}</p>}
                    <ul className="msec__list">
                        {s.items.map((it) => (
                            <li key={it.name} className="mitem">
                                <div className="mitem__top">
                                    <span className="mitem__name">{it.name}{it.note && !LONG.test(it.note) && <small> · {it.note}</small>}</span>
                                    <span className="mitem__dots" aria-hidden="true" />
                                    {it.prices
                                        ? (
                                            <span className="mitem__prices">
                                                {it.prices.map(([label, v]) => (
                                                    <span className="mitem__price" key={label}><small>{label}</small>{money(v)}</span>
                                                ))}
                                            </span>
                                        )
                                        : <span className="mitem__price">{money(it.price)}</span>}
                                </div>
                                {it.desc && <p className="mitem__desc">{it.desc}</p>}
                                {it.note && LONG.test(it.note) && <p className="mitem__note">{it.note}</p>}
                            </li>
                        ))}
                    </ul>
                    {s.lists && (
                        <div className="msec__lists">
                            {s.lists.map((l) => (
                                <div key={l.title}>
                                    <h4>{l.title}</h4>
                                    <ul>{l.items.map((x) => <li key={x}>{x}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                    )}
                    {s.notes && <div className="msec__notes">{s.notes.map((n) => <p key={n}>{n}</p>)}</div>}
                </section>
            ))}

            {menu.footnote && <p className="menuv__foot">{menu.footnote}</p>}
        </div>
    );
}
