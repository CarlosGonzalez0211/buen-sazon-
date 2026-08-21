// menus.js – Per-location menu data for El Buen Sazón


const sharedItems = {
    tacosPastor: {
        id: 'tacos-pastor',
        name: 'Tacos al Pastor',
        description: 'Carne de puerco marinada con chile guajillo, servida en tortilla de maíz con piña, cebolla y cilantro.',
        price: 3.50,
        popular: true,
    },
    tacosAsada: {
        id: 'tacos-asada',
        name: 'Tacos de Carne Asada',
        description: 'Carne asada estilo Juárez en tortilla de harina con guacamole, pico de gallo y salsa roja.',
        price: 4.00,
        popular: true,
    },
    tacosBirria: {
        id: 'tacos-birria',
        name: 'Tacos de Birria',
        description: 'Birria de res en tortilla de maíz tostada con consomé, cebolla, cilantro y limón.',
        price: 4.50,
    },
    tacosCabeza: {
        id: 'tacos-cabeza',
        name: 'Tacos de Cabeza',
        description: 'Cabeza de res tradicional con cebolla, cilantro y salsa verde en tortilla de maíz.',
        price: 3.75,
    },
    burritoAsada: {
        id: 'burrito-asada',
        name: 'Burrito de Carne Asada',
        description: 'Burrito en tortilla de harina XXL con carne asada, frijoles, arroz, queso, guacamole y pico de gallo.',
        price: 9.50,
        popular: true,
    },
    burritoPastor: {
        id: 'burrito-pastor',
        name: 'Burrito al Pastor',
        description: 'Gran burrito de harina con carne al pastor, papas, frijoles, salsa roja y queso Chihuahua.',
        price: 9.00,
    },
    burritoChilorio: {
        id: 'burrito-chilorio',
        name: 'Burrito de Chilorio',
        description: 'Burrito con chilorio de puerco, frijoles refritos, crema y queso fundido.',
        price: 8.50,
    },
    tortaAsada: {
        id: 'torta-asada',
        name: 'Torta de Carne Asada',
        description: 'Pantera o bolillo con carne asada, aguacate, jalapeño, jitomate, lechuga y mayonesa.',
        price: 8.00,
        popular: true,
    },
    tortaCarnitas: {
        id: 'torta-carnitas',
        name: 'Torta de Carnitas',
        description: 'Carnitas de puerco en bolillo con frijoles, aguacate, cebolla y chile jalapeño.',
        price: 7.50,
    },
    quesadillaAsada: {
        id: 'quesadilla-asada',
        name: 'Quesadilla de Carne Asada',
        description: 'Tortilla de harina grande con queso Chihuahua derretido y carne asada, acompañada de guacamole.',
        price: 7.00,
        popular: true,
    },
    quesadillaChampiñones: {
        id: 'quesadilla-champinones',
        name: 'Quesadilla de Champiñones',
        description: 'Tortilla de harina con queso Oaxaca y champiñones salteados con epazote y chile serrano.',
        price: 6.50,
    },
    enchiladasVerdes: {
        id: 'enchiladas-verdes',
        name: 'Enchiladas Verdes',
        description: 'Tres enchiladas de pollo en salsa tomatillo verde, con crema, queso fresco y cebolla.',
        price: 10.00,
    },
    enchiladasRojas: {
        id: 'enchiladas-rojas',
        name: 'Enchiladas Rojas',
        description: 'Enchiladas en chile rojo ancho con queso, cebolla y crema. Servidas con arroz y frijoles.',
        price: 10.00,
    },
    elote: {
        id: 'elote-loco',
        name: 'Elote Loco',
        description: 'Elote en vaso o en mazorca con mayonesa, chile, limón, queso cotija y chamoy.',
        price: 4.50,
        popular: true,
    },
    tamales: {
        id: 'tamales',
        name: 'Tamales (3 pzas)',
        description: 'Tres tamales de elote, rajas con queso o pollo en salsa verde. Tradición en cada bocado.',
        price: 6.00,
    },
    aguaJamaica: {
        id: 'agua-jamaica',
        name: 'Agua de Jamaica',
        description: 'Refrescante agua fresca de flor de Jamaica con poca azúcar. Tamaño grande.',
        price: 3.00,
        popular: true,
    },
    aguaTamarindo: {
        id: 'agua-tamarindo',
        name: 'Agua de Tamarindo',
        description: 'Agua fresca de tamarindo ligeramente picante. Sabor auténtico de la calle.',
        price: 3.00,
    },
    aguaSandia: {
        id: 'agua-sandia',
        name: 'Agua de Sandía',
        description: 'Agua fresca de sandía natural, bien fría. La favorita del verano.',
        price: 3.00,
    },
    refrescos: {
        id: 'refrescos',
        name: 'Refrescos',
        description: 'Coca-Cola, Sprite, Fanta, Jarritos de tamarindo, mandarina o limón.',
        price: 2.50,
    },
};

export const menus = {
    'menu-centro': {
        locationId: 'sucursal-1',
        categories: [
            {
                id: 'tacos',
                name: 'Tacos',
                icon: '🌮',
                items: [
                    sharedItems.tacosPastor,
                    sharedItems.tacosAsada,
                    sharedItems.tacosBirria,
                    sharedItems.tacosCabeza,
                ],
            },
            {
                id: 'burritos',
                name: 'Burritos',
                icon: '🌯',
                items: [
                    sharedItems.burritoAsada,
                    sharedItems.burritoPastor,
                    sharedItems.burritoChilorio,
                ],
            },
            {
                id: 'tortas',
                name: 'Tortas',
                icon: '🥪',
                items: [
                    sharedItems.tortaAsada,
                    sharedItems.tortaCarnitas,
                ],
            },
            {
                id: 'quesadillas',
                name: 'Quesadillas',
                icon: '🫓',
                items: [
                    sharedItems.quesadillaAsada,
                    sharedItems.quesadillaChampiñones,
                ],
            },
            {
                id: 'antojitos',
                name: 'Antojitos Mexicanos',
                icon: '🌽',
                items: [
                    sharedItems.enchiladasVerdes,
                    sharedItems.enchiladasRojas,
                    sharedItems.elote,
                    sharedItems.tamales,
                ],
            },
            {
                id: 'bebidas',
                name: 'Bebidas',
                icon: '🥤',
                items: [
                    sharedItems.aguaJamaica,
                    sharedItems.aguaTamarindo,
                    sharedItems.aguaSandia,
                    sharedItems.refrescos,
                ],
            },
        ],
    },

    'menu-sur': {
        locationId: 'sucursal-2',
        categories: [
            {
                id: 'tacos',
                name: 'Tacos',
                icon: '🌮',
                items: [
                    sharedItems.tacosPastor,
                    sharedItems.tacosAsada,
                    { ...sharedItems.tacosBirria, price: 4.75 },
                    {
                        id: 'tacos-machaca',
                        name: 'Tacos de Machaca',
                        description: 'Machaca de res con huevo, chile verde y cebolla en tortilla de harina.',
                        price: 4.00,
                    },
                ],
            },
            {
                id: 'burritos',
                name: 'Burritos',
                icon: '🌯',
                items: [
                    { ...sharedItems.burritoAsada, price: 10.00 },
                    {
                        id: 'burrito-machaca',
                        name: 'Burrito de Machaca',
                        description: 'Burrito XXL con machaca de res, papas, frijoles y salsa roja.',
                        price: 9.50,
                    },
                    {
                        id: 'burrito-pollo',
                        name: 'Burrito de Pollo',
                        description: 'Burrito de harina con pollo a la plancha, pico de gallo, queso y guacamole.',
                        price: 8.75,
                    },
                ],
            },
            {
                id: 'tortas',
                name: 'Tortas',
                icon: '🥪',
                items: [
                    sharedItems.tortaAsada,
                    sharedItems.tortaCarnitas,
                    {
                        id: 'torta-milanesa',
                        name: 'Torta de Milanesa',
                        description: 'Milanesa de res empanizada en bolillo con jitomate, aguacate y mayonesa jalapeño.',
                        price: 8.50,
                    },
                ],
            },
            {
                id: 'quesadillas',
                name: 'Quesadillas',
                icon: '🫓',
                items: [
                    sharedItems.quesadillaAsada,
                    sharedItems.quesadillaChampiñones,
                    {
                        id: 'quesadilla-pastor',
                        name: 'Quesadilla al Pastor',
                        description: 'Tortilla de harina con carne al pastor, queso y piña al comal.',
                        price: 7.50,
                    },
                ],
            },
            {
                id: 'antojitos',
                name: 'Antojitos Mexicanos',
                icon: '🌽',
                items: [
                    sharedItems.enchiladasVerdes,
                    sharedItems.enchiladasRojas,
                    sharedItems.elote,
                    sharedItems.tamales,
                    {
                        id: 'flautas',
                        name: 'Flautas Doradas (4 pzas)',
                        description: 'Flautas de pollo doradas crujientes con crema, queso, lechuga y pico de gallo.',
                        price: 8.00,
                    },
                ],
            },
            {
                id: 'bebidas',
                name: 'Bebidas',
                icon: '🥤',
                items: [
                    sharedItems.aguaJamaica,
                    sharedItems.aguaTamarindo,
                    sharedItems.aguaSandia,
                    sharedItems.refrescos,
                    {
                        id: 'horchata',
                        name: 'Agua de Horchata',
                        description: 'Horchata de arroz con canela, bien fría y cremosa.',
                        price: 3.00,
                    },
                ],
            },
        ],
    },
};

export const getMenuByLocationId = (menuId) => menus[menuId] || null;

export const getAllPopularItems = () => {
    const items = [];
    Object.values(menus).forEach(menu => {
        menu.categories.forEach(cat => {
            cat.items.forEach(item => {
                if (item.popular && !items.find(i => i.id === item.id)) {
                    items.push(item);
                }
            });
        });
    });
    return items.slice(0, 6);
};
