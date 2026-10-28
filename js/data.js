(function (root) {
  'use strict';

  const B = root.BAMBOLINE = root.BAMBOLINE || {};

  const STORE = {
    name: 'Sorveteria Bamboline',
    shortName: 'Bamboline',
    service: 'Delivery e consumo no local',
    address: {
      street: 'Rua Caçapava, nº 4257',
      neighborhood: 'Bairro 9 de Cima',
      city: 'Ariquemes',
      state: 'RO',
      full: 'Rua Caçapava, nº 4257 – Bairro 9 de Cima, Ariquemes – RO',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Rua Caçapava, 4257, Bairro 9 de Cima, Ariquemes - RO')
    },
    instagram: {
      handle: '@sorveteriabamboline',
      url: 'https://www.instagram.com/sorveteriabamboline/'
    },
    whatsapp: {
      primary: { digits: '5569993522704', display: '(69) 99352-2704' }
    },
    timeZone: 'America/Porto_Velho',
    hours: {
      0: { open: '15:00', close: '23:00' },
      1: { open: '15:00', close: '22:00' },
      2: { open: '15:00', close: '23:00' },
      3: { open: '15:00', close: '23:00' },
      4: { open: '15:00', close: '23:00' },
      5: { open: '15:00', close: '23:00' },
      6: { open: '15:00', close: '23:00' }
    },
    hoursDisplay: [
      { days: 'Segunda-feira', hours: '15h às 22h' },
      { days: 'Terça a domingo', hours: '15h às 23h' }
    ],
    weekdayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  };

  const FLAVORS = [
    { id: 'morango-baunilha', label: 'Morango e Baunilha' },
    { id: 'chocolate-leite-condensado', label: 'Chocolate e Leite Condensado' },
    { id: 'acai', label: 'Açaí' },
    { id: 'leitinho', label: 'Leitinho' }
  ];

  const CATEGORIES = [
    {
      id: 'tradicionais',
      label: 'Sorvetes tradicionais',
      shortLabel: 'Tradicionais',
      description: 'Os sabores de sempre, do copo ao milk-shake.',
      flavorIds: ['morango-baunilha', 'chocolate-leite-condensado']
    },
    {
      id: 'acai-leitinho',
      label: 'Açaí e Leitinho',
      shortLabel: 'Açaí e Leitinho',
      description: 'Açaí e leitinho em copos, taça, casquinha, cascão e milk-shake.',
      flavorIds: ['acai', 'leitinho']
    },
    {
      id: 'bebidas',
      label: 'Bebidas',
      shortLabel: 'Bebidas',
      description: 'Para acompanhar o seu pedido.',
      flavorIds: []
    }
  ];

  const CUP_SIZES = [
    { id: '250', label: '250 ml', price: 700 },
    { id: '300', label: '300 ml', price: 900 },
    { id: '400', label: '400 ml', price: 1200 },
    { id: '500', label: '500 ml', price: 1500 },
    { id: '700', label: '700 ml', price: 1700 }
  ];

  const SHAKE_SIZES = [
    { id: '300', label: '300 ml', price: 900 },
    { id: '400', label: '400 ml', price: 1200 },
    { id: '500', label: '500 ml', price: 1500 },
    { id: '700', label: '700 ml', price: 1700 }
  ];

  const ACAI_CUP_SIZES = [
    { id: '300', label: '300 ml', price: 1200 },
    { id: '400', label: '400 ml', price: 1500 },
    { id: '500', label: '500 ml', price: 1700 },
    { id: '700', label: '700 ml', price: 2000 }
  ];

  const ACAI_SHAKE_SIZES = [
    { id: '300', label: '300 ml', price: 1200 },
    { id: '400', label: '400 ml', price: 1500 },
    { id: '500', label: '500 ml', price: 1700 },
    { id: '700', label: '700 ml', price: 2000 }
  ];

  // Limite de sabores por item: 1 mantém a regra atual. Confirmar com a loja antes de liberar combinações.
  const PRODUCTS = [
    {
      id: 'trad-copo',
      categoryId: 'tradicionais',
      name: 'Copo',
      fullName: 'Copo de sorvete',
      orderName: 'Copo de sorvete',
      description: 'Escolha o sabor e o tamanho do seu copo.',
      art: 'cup',
      maxFlavors: 1,
      image: 'assets/copo-sorvete-1.jpg',
      gallery: ['assets/copo-sorvete-1.jpg', 'assets/copo-sorvete-2.jpg'],
      imageAlt: 'Copo de sorvete com camadas cremosas em espiral',
      variants: CUP_SIZES
    },
    {
      id: 'trad-taca',
      categoryId: 'tradicionais',
      name: 'Taça',
      fullName: 'Taça de sorvete',
      orderName: 'Taça de sorvete',
      description: 'A taça leva o sabor que você escolher.',
      art: 'taca',
      maxFlavors: 1,
      image: 'assets/taca-produto.jpg',
      imageAlt: 'Taça de sorvete com calda de chocolate, morango e crocante',
      variants: [{ id: 'unico', label: null, price: 1500 }]
    },
    {
      id: 'trad-casquinha',
      categoryId: 'tradicionais',
      name: 'Casquinha',
      fullName: 'Casquinha',
      orderName: 'Casquinha',
      description: 'Casquinha com o sabor escolhido por você.',
      art: 'casquinha',
      maxFlavors: 1,
      image: 'assets/casquinha-produto.jpg',
      imageAlt: 'Casquinhas de sorvete com bolas de sorvete e calda de chocolate',
      variants: [{ id: 'unico', label: null, price: 700 }]
    },
    {
      id: 'trad-cascao',
      categoryId: 'tradicionais',
      name: 'Cascão',
      fullName: 'Cascão',
      orderName: 'Cascão',
      description: 'Cascão para levar o seu sorvete.',
      art: 'cascao',
      maxFlavors: 1,
      image: 'assets/cascao-produto.jpg',
      imageAlt: 'Cascão de waffle com bolas de sorvete de chocolate e creme',
      variants: [{ id: 'unico', label: null, price: 1000 }]
    },
    {
      id: 'trad-milkshake',
      categoryId: 'tradicionais',
      name: 'Milk-shake',
      fullName: 'Milk-shake',
      orderName: 'Milk-shake',
      description: 'Milk-shake no sabor e no tamanho que você preferir.',
      art: 'milkshake',
      maxFlavors: 1,
      image: 'assets/milkshake-1.jpg',
      gallery: ['assets/milkshake-1.jpg', 'assets/milkshake-2.jpg'],
      imageAlt: 'Milk-shake cremoso com calda e canudo',
      variants: SHAKE_SIZES
    },
    {
      id: 'acai-copo',
      categoryId: 'acai-leitinho',
      name: 'Copo',
      fullName: 'Copo de açaí e leitinho',
      orderName: 'Copo de açaí e leitinho',
      description: 'Copo de açaí ou leitinho, no tamanho que você quiser.',
      art: 'cup',
      image: 'assets/acai-leitinho-produto.jpg',
      imageAlt: 'Copos de açaí e leitinho com camadas cremosas',
      maxFlavors: 1,
      variants: ACAI_CUP_SIZES
    },
    {
      id: 'acai-taca',
      categoryId: 'acai-leitinho',
      name: 'Taça',
      fullName: 'Taça de açaí e leitinho',
      orderName: 'Taça de açaí e leitinho',
      description: 'Taça de açaí ou leitinho.',
      art: 'taca',
      image: 'assets/acai-taca-produto.jpg',
      imageAlt: 'Taça de açaí com camadas cremosas e granola',
      maxFlavors: 1,
      variants: [{ id: 'unico', label: null, price: 1500 }]
    },
    {
      id: 'acai-casquinha',
      categoryId: 'acai-leitinho',
      name: 'Casquinha',
      fullName: 'Casquinha de açaí e leitinho',
      orderName: 'Casquinha de açaí e leitinho',
      description: 'Casquinha de açaí ou leitinho.',
      art: 'casquinha',
      maxFlavors: 1,
      variants: [{ id: 'unico', label: null, price: 1000 }]
    },
    {
      id: 'acai-cascao',
      categoryId: 'acai-leitinho',
      name: 'Cascão',
      fullName: 'Cascão de açaí e leitinho',
      orderName: 'Cascão de açaí e leitinho',
      description: 'Cascão de açaí ou leitinho.',
      art: 'cascao',
      maxFlavors: 1,
      variants: [{ id: 'unico', label: null, price: 1300 }]
    },
    {
      id: 'acai-milkshake',
      categoryId: 'acai-leitinho',
      name: 'Milk-shake',
      fullName: 'Milk-shake de açaí e leitinho',
      orderName: 'Milk-shake de açaí e leitinho',
      description: 'Milk-shake de açaí ou leitinho.',
      art: 'milkshake',
      maxFlavors: 1,
      variants: ACAI_SHAKE_SIZES
    },
    {
      id: 'agua',
      categoryId: 'bebidas',
      name: 'Água',
      fullName: 'Água',
      orderName: 'Água',
      description: 'Água gelada.',
      art: 'water',
      image: 'assets/agua-produto.jpg',
      imageAlt: 'Garrafa de água com respingos',
      variants: [{ id: 'unico', label: null, price: 250 }]
    },
    {
      id: 'agua-gas',
      categoryId: 'bebidas',
      name: 'Água com gás',
      fullName: 'Água com gás',
      orderName: 'Água com gás',
      description: 'Água com gás gelada.',
      art: 'sparkling',
      image: 'assets/agua-com-gas-produto.jpg',
      imageAlt: 'Garrafa de água com gás',
      variants: [{ id: 'unico', label: null, price: 300 }]
    },
    {
      id: 'coca-lata',
      categoryId: 'bebidas',
      name: 'Coca-Cola lata',
      fullName: 'Coca-Cola lata',
      orderName: 'Coca-Cola lata',
      description: 'Lata de Coca-Cola gelada.',
      art: 'cola-can',
      image: 'assets/coca-lata-produto.jpg',
      imageAlt: 'Lata de Coca-Cola Original gelada',
      variants: [{ id: 'unico', label: null, price: 500 }]
    },
    {
      id: 'coca-600',
      categoryId: 'bebidas',
      name: 'Coca-Cola 600 ml',
      fullName: 'Coca-Cola 600 ml',
      orderName: 'Coca-Cola 600 ml',
      description: 'Garrafa de 600 ml gelada.',
      art: 'cola-bottle',
      image: 'assets/coca-600-produto.jpg',
      imageAlt: 'Garrafa de Coca-Cola Original de 600 ml',
      variants: [{ id: 'unico', label: null, price: 700 }]
    },
    {
      id: 'coca-1l',
      categoryId: 'bebidas',
      name: 'Coca-Cola 1 litro',
      fullName: 'Coca-Cola 1 litro',
      orderName: 'Coca-Cola 1 litro',
      description: 'Garrafa de 1 litro gelada.',
      art: 'cola-bottle',
      image: 'assets/coca-1l-produto.jpg',
      imageAlt: 'Garrafa de Coca-Cola Original de 1 litro',
      variants: [{ id: 'unico', label: null, price: 1000 }]
    },
    {
      id: 'coca-2l',
      categoryId: 'bebidas',
      name: 'Coca-Cola 2 litros',
      fullName: 'Coca-Cola 2 litros',
      orderName: 'Coca-Cola 2 litros',
      description: 'Garrafa de 2 litros gelada.',
      art: 'cola-bottle',
      image: 'assets/coca-2l-produto.jpg',
      imageAlt: 'Garrafa de Coca-Cola Original de 2 litros',
      variants: [{ id: 'unico', label: null, price: 1500 }]
    },
    {
      id: 'bananinha',
      categoryId: 'bebidas',
      name: 'Bananinha',
      fullName: 'Bananinha',
      orderName: 'Bananinha',
      description: 'Para acompanhar seu pedido.',
      art: 'banana',
      variants: [{ id: 'unico', label: null, price: 300 }]
    }
  ];

  const DELIVERY_ZONES = [
    { id: 'setor-fora-lista', label: 'Setor que não está na lista', fee: 800 },
    { id: 'zona-sul-bela-vista', label: 'Zona Sul e Bela Vista', fee: 1000 },
    { id: 'marechal-multirao', label: 'Marechal e Multirão', fee: 1000 },
    { id: 'condominios', label: 'Condomínios', fee: 1000 },
    { id: 'hospitais-reparticoes', label: 'Hospitais e Repartições Públicas', fee: 800 },
    { id: 'hoteis-br', label: 'Hotéis da BR', fee: 1000 },
    { id: 'hoteis-sem-br', label: 'Hotéis sem ser da BR', fee: 800 },
    { id: 'supremax-rical-entre-rios', label: 'Supremax, Rical e Entre Rios', fee: 1500 },
    { id: 'monte-cristo-2', label: 'Monte Cristo 2', fee: 1000 },
    { id: 'white-solder-prf', label: 'White Solder, PRF', fee: 1000 },
    { id: 'zaltana-jamary', label: 'Zaltana, Bairro Jamary', fee: 2000 },
    { id: 'aterro-sanitario', label: 'Aterro Sanitário', fee: 2000 },
    { id: 'taxa-compras', label: 'Taxas para fazer compras', fee: 1500 },
    { id: 'demais-setores', label: 'Demais setores', fee: 800 }
  ];

  const flavorMap = FLAVORS.reduce(function (acc, flavor) {
    acc[flavor.id] = flavor;
    return acc;
  }, {});

  const categoryMap = CATEGORIES.reduce(function (acc, category) {
    acc[category.id] = category;
    return acc;
  }, {});

  const productMap = PRODUCTS.reduce(function (acc, product) {
    acc[product.id] = product;
    return acc;
  }, {});

  const zoneMap = DELIVERY_ZONES.reduce(function (acc, zone) {
    acc[zone.id] = zone;
    return acc;
  }, {});

  B.data = {
    store: STORE,
    flavors: FLAVORS,
    flavorMap: flavorMap,
    categories: CATEGORIES,
    categoryMap: categoryMap,
    products: PRODUCTS,
    productMap: productMap,
    deliveryZones: DELIVERY_ZONES,
    zoneMap: zoneMap,
    maxQuantity: 99
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
