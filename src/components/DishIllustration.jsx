// DishIllustration.jsx — Hand-drawn-style flat SVG illustrations for menu dishes.
// Replaces photography with a warm, artisan "carta pintada" look. No external assets.

const C = {
    plate: '#FBF3E6',
    plateRim: '#B14A2E',
    plateShade: '#EAD9BC',
    cornTortilla: '#E7B84D',
    flourTortilla: '#ECDBB4',
    masa: '#E4C079',
    meat: '#8A4A2A',
    meatDark: '#6F3A20',
    pastor: '#C0492C',
    cheese: '#F2D06B',
    cheeseDark: '#E0B23F',
    green: '#6E8A3F',
    greenDark: '#566E2F',
    salsa: '#C0341D',
    avocado: '#7E9440',
    cream: '#FBF3E6',
    onion: '#F3EAD8',
    jamaica: '#9E2B3F',
    tamarindo: '#B5651D',
    sandia: '#E0574C',
    glass: '#FCEFD6',
    outline: '#5A3719',
};

function Plate({ children }) {
    return (
        <g>
            <ellipse cx="100" cy="150" rx="70" ry="12" fill="rgba(90,55,25,0.12)" />
            <circle cx="100" cy="100" r="82" fill={C.plateRim} />
            <circle cx="100" cy="100" r="74" fill={C.plate} />
            <circle cx="100" cy="100" r="74" fill="none" stroke={C.plateShade} strokeWidth="3" />
            {children}
        </g>
    );
}

const Taco = (
    <Plate>
        <path d="M45 118 Q100 55 155 118 Q100 138 45 118 Z" fill={C.cornTortilla} stroke={C.outline} strokeWidth="2.5" />
        <path d="M55 112 Q100 70 145 112 Q100 126 55 112 Z" fill={C.meat} />
        <circle cx="80" cy="104" r="5" fill={C.green} />
        <circle cx="100" cy="100" r="5" fill={C.salsa} />
        <circle cx="120" cy="104" r="5" fill={C.onion} />
        <circle cx="92" cy="108" r="4" fill={C.green} />
        <circle cx="110" cy="108" r="4" fill={C.cheese} />
    </Plate>
);

const Burrito = (
    <Plate>
        <path d="M62 70 L138 118 Q150 128 138 138 L74 132 Q58 128 60 112 Z" fill={C.flourTortilla} stroke={C.outline} strokeWidth="2.5" />
        <path d="M66 78 L120 112" stroke={C.plateShade} strokeWidth="3" strokeLinecap="round" />
        <path d="M78 92 L128 124" stroke={C.plateShade} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="68" cy="76" rx="12" ry="10" fill={C.pastor} stroke={C.outline} strokeWidth="2" />
        <circle cx="64" cy="74" r="3" fill={C.green} />
        <circle cx="72" cy="78" r="3" fill={C.cheese} />
    </Plate>
);

const Torta = (
    <Plate>
        <path d="M46 96 Q100 74 154 96 Q154 88 100 82 Q46 88 46 96 Z" fill={C.masa} stroke={C.outline} strokeWidth="2.5" />
        <rect x="48" y="96" width="104" height="10" fill={C.green} />
        <rect x="48" y="104" width="104" height="9" fill={C.meat} />
        <rect x="48" y="111" width="104" height="7" fill={C.salsa} />
        <path d="M46 118 Q100 138 154 118 L154 106 Q100 122 46 106 Z" fill={C.masa} stroke={C.outline} strokeWidth="2.5" />
        <circle cx="60" cy="88" r="2.5" fill={C.outline} opacity="0.5" />
        <circle cx="80" cy="85" r="2.5" fill={C.outline} opacity="0.5" />
    </Plate>
);

const Quesadilla = (
    <Plate>
        <path d="M100 60 A76 76 0 0 1 168 108 L100 108 Z" fill="none" />
        <path d="M52 116 A56 56 0 0 1 148 116 Z" fill={C.flourTortilla} stroke={C.outline} strokeWidth="2.5" />
        <path d="M62 116 A44 44 0 0 1 138 116 Z" fill={C.cheese} opacity="0.55" />
        <path d="M100 74 L100 116" stroke={C.outline} strokeWidth="2" opacity="0.4" />
        <path d="M76 96 L124 96" stroke={C.outline} strokeWidth="2" opacity="0.35" />
        <path d="M84 84 Q90 78 96 84" stroke={C.cheeseDark} strokeWidth="3" fill="none" strokeLinecap="round" />
    </Plate>
);

const Enchiladas = (
    <Plate>
        <g stroke={C.outline} strokeWidth="2.5">
            <rect x="46" y="86" width="108" height="16" rx="8" fill={C.green} />
            <rect x="46" y="106" width="108" height="16" rx="8" fill={C.greenDark} />
        </g>
        <path d="M46 96 Q100 90 154 96" stroke={C.cream} strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M46 116 Q100 110 154 116" stroke={C.cream} strokeWidth="3" fill="none" opacity="0.7" />
        <circle cx="70" cy="94" r="3" fill={C.onion} />
        <circle cx="120" cy="114" r="3" fill={C.onion} />
        <circle cx="100" cy="94" r="3.5" fill={C.cheese} />
    </Plate>
);

const Elote = (
    <Plate>
        <rect x="90" y="52" width="20" height="96" rx="10" fill={C.masa} stroke={C.outline} strokeWidth="2.5" />
        <g fill={C.cheeseDark}>
            {[60, 72, 84, 96, 108, 120, 132].map((y) => (
                <g key={y}>
                    <circle cx="96" cy={y} r="2.5" /><circle cx="104" cy={y} r="2.5" />
                </g>
            ))}
        </g>
        <path d="M100 52 Q86 40 78 48" stroke={C.green} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M100 52 Q114 40 122 48" stroke={C.greenDark} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="150" r="4" fill={C.salsa} />
    </Plate>
);

const Agua = (color) => (
    <Plate>
        <path d="M74 66 L126 66 L120 142 Q100 150 80 142 Z" fill={C.glass} stroke={C.outline} strokeWidth="2.5" />
        <path d="M77 80 L123 80 L118 138 Q100 145 82 138 Z" fill={color} opacity="0.85" />
        <ellipse cx="100" cy="80" rx="23" ry="5" fill="#fff" opacity="0.5" />
        <rect x="112" y="52" width="4" height="40" rx="2" fill={C.salsa} transform="rotate(12 114 72)" />
        <circle cx="90" cy="100" r="3" fill="#fff" opacity="0.4" />
        <circle cx="108" cy="118" r="2.5" fill="#fff" opacity="0.4" />
    </Plate>
);

const Tamal = (
    <Plate>
        <path d="M70 72 Q100 62 130 72 L124 140 Q100 148 76 140 Z" fill="#D8C48A" stroke={C.outline} strokeWidth="2.5" />
        <path d="M70 72 Q100 62 130 72" stroke={C.greenDark} strokeWidth="3" fill="none" />
        <path d="M84 78 L80 138" stroke={C.masa} strokeWidth="2" opacity="0.6" />
        <path d="M100 76 L100 142" stroke={C.masa} strokeWidth="2" opacity="0.6" />
        <path d="M116 78 L120 138" stroke={C.masa} strokeWidth="2" opacity="0.6" />
        <path d="M72 132 Q100 124 128 132 L124 140 Q100 148 76 140 Z" fill={C.green} opacity="0.5" />
    </Plate>
);

const Flauta = (
    <Plate>
        <g stroke={C.outline} strokeWidth="2.5" fill={C.cornTortilla}>
            <rect x="44" y="80" width="112" height="12" rx="6" transform="rotate(-8 100 86)" />
            <rect x="44" y="100" width="112" height="12" rx="6" transform="rotate(-8 100 106)" />
        </g>
        <path d="M50 92 Q100 84 150 92" stroke={C.cream} strokeWidth="3" fill="none" opacity="0.6" />
        <circle cx="72" cy="86" r="3" fill={C.green} />
        <circle cx="128" cy="106" r="3" fill={C.salsa} />
        <circle cx="100" cy="98" r="3" fill={C.cheese} />
    </Plate>
);

const Refresco = (
    <Plate>
        <rect x="80" y="52" width="40" height="96" rx="10" fill={C.salsa} stroke={C.outline} strokeWidth="2.5" />
        <rect x="86" y="70" width="28" height="30" rx="4" fill={C.cream} opacity="0.9" />
        <rect x="84" y="52" width="32" height="8" rx="3" fill={C.plateRim} />
        <circle cx="100" cy="85" r="6" fill={C.salsa} />
    </Plate>
);

const byType = {
    taco: Taco,
    burrito: Burrito,
    torta: Torta,
    quesadilla: Quesadilla,
    enchiladas: Enchiladas,
    elote: Elote,
    tamal: Tamal,
    flauta: Flauta,
    'agua-jamaica': Agua(C.jamaica),
    'agua-tamarindo': Agua(C.tamarindo),
    'agua-sandia': Agua(C.sandia),
    'agua-horchata': Agua('#F0E4CB'),
    agua: Agua(C.jamaica),
    refresco: Refresco,
};

// Map a menu item id (or dish name) to an illustration type.
export function dishTypeFor(idOrName = '') {
    const s = idOrName.toLowerCase();
    if (s.includes('horchata')) return 'agua-horchata';
    if (s.includes('tamarindo')) return 'agua-tamarindo';
    if (s.includes('sandia') || s.includes('sandía')) return 'agua-sandia';
    if (s.includes('jamaica') || s.includes('agua')) return 'agua-jamaica';
    if (s.includes('refresco')) return 'refresco';
    if (s.includes('taco')) return 'taco';
    if (s.includes('burrito')) return 'burrito';
    if (s.includes('torta')) return 'torta';
    if (s.includes('quesadilla')) return 'quesadilla';
    if (s.includes('enchilada')) return 'enchiladas';
    if (s.includes('elote')) return 'elote';
    if (s.includes('tamal')) return 'tamal';
    if (s.includes('flauta')) return 'flauta';
    if (s.includes('bebida')) return 'agua-jamaica';
    return 'taco';
}

export default function DishIllustration({ type, name, className = '', title }) {
    const key = type || dishTypeFor(name || '');
    const art = byType[key] || byType.taco;
    return (
        <svg
            viewBox="0 0 200 200"
            className={className}
            role="img"
            aria-label={title || name || 'Ilustración de platillo'}
            xmlns="http://www.w3.org/2000/svg"
        >
            {art}
        </svg>
    );
}
