// locations.js – Branch data for El Buen Sazón

export const locations = [
    {
        id: 'sucursal-1',
        name: 'Sucursal Centro',
        shortName: 'Centro',
        address: 'Av. Juárez 1540, Col. Centro, Ciudad Juárez, Chih.',
        phone: '+52 656 123 4567',
        email: 'centro@elbuensazon.mx',
        hours: {
            weekday: 'Lun – Vie: 8:00 AM – 10:00 PM',
            weekend: 'Sáb – Dom: 8:00 AM – 11:00 PM',
        },
        status: 'open',
        features: ['Comedor amplio', 'Wi-Fi gratis', 'Estacionamiento'],
        menuId: 'menu-centro',
    },
    {
        id: 'sucursal-2',
        name: 'Sucursal Sur',
        shortName: 'Sur',
        address: 'Blvd. Zaragoza 4890, Col. Partido Romero, Ciudad Juárez, Chih.',
        phone: '+52 656 234 5678',
        email: 'sur@elbuensazon.mx',
        hours: {
            weekday: 'Lun – Vie: 9:00 AM – 10:00 PM',
            weekend: 'Sáb – Dom: 9:00 AM – 11:00 PM',
        },
        status: 'open',
        features: ['Drive-through', 'Área infantil', 'Pedidos en línea'],
        menuId: 'menu-sur',
    },
    {
        id: 'sucursal-3',
        name: 'Sucursal Norte',
        shortName: 'Norte',
        address: 'Blvd. Independencia Norte 2210, Col. San Lorenzo, Ciudad Juárez, Chih.',
        phone: null,
        email: null,
        hours: null,
        status: 'coming-soon',
        features: ['Próximamente', 'Mayor espacio', 'Terraza exterior'],
        menuId: null,
        openingSoon: 'Próximamente 2025',
    },
];

export const getLocationById = (id) => locations.find(l => l.id === id);
