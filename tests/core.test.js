'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/data.js');
const core = require('../js/cart.js');

const data = globalThis.BAMBOLINE.data;

function add(cart, productId, variantId, flavorId, qty) {
  return core.addToCart(cart, {
    productId,
    variantId,
    flavorId,
    qty
  }).cart;
}

function sampleCart() {
  let cart = [];
  cart = add(cart, 'trad-copo', '300', 'morango-baunilha', 1);
  cart = add(cart, 'coca-lata', 'unico', null, 2);
  return cart;
}

function validOrder(overrides) {
  return Object.assign({
    cart: sampleCart(),
    customerName: 'Maria Souza',
    phone: '(69) 99999-9999',
    mode: 'delivery',
    zoneId: 'zona-sul-bela-vista',
    address: {
      street: 'Rua das Flores',
      number: '120',
      neighborhood: 'Bela Vista',
      complement: 'Casa 2',
      reference: 'Perto da praça'
    },
    notes: 'Sem talheres.'
  }, overrides || {});
}

test('formata valores em reais sem erro de ponto flutuante', function () {
  assert.equal(core.formatBRL(700), 'R$ 7,00');
  assert.equal(core.formatBRL(900), 'R$ 9,00');
  assert.equal(core.formatBRL(150000), 'R$ 1.500,00');
  assert.equal(core.formatBRL(0), 'R$ 0,00');
});

test('mantém os preços de sorvetes tradicionais exatamente como cadastrados', function () {
  const cup = data.productMap['trad-copo'].variants.map(function (variant) {
    return [variant.label, variant.price];
  });
  assert.deepEqual(cup, [
    ['250 ml', 700],
    ['300 ml', 900],
    ['400 ml', 1200],
    ['500 ml', 1500],
    ['700 ml', 1700]
  ]);
  assert.equal(data.productMap['trad-taca'].variants[0].price, 1500);
  assert.equal(data.productMap['trad-casquinha'].variants[0].price, 700);
  assert.equal(data.productMap['trad-cascao'].variants[0].price, 1000);
  const shake = data.productMap['trad-milkshake'].variants.map(function (variant) {
    return variant.price;
  });
  assert.deepEqual(shake, [900, 1200, 1500, 1700]);
});

test('mantém os preços de açaí e leitinho exatamente como cadastrados', function () {
  const cup = data.productMap['acai-copo'].variants.map(function (variant) {
    return [variant.label, variant.price];
  });
  assert.deepEqual(cup, [
    ['300 ml', 1200],
    ['400 ml', 1500],
    ['500 ml', 1700],
    ['700 ml', 2000]
  ]);
  assert.equal(data.productMap['acai-taca'].variants[0].price, 1500);
  assert.equal(data.productMap['acai-casquinha'].variants[0].price, 1000);
  assert.equal(data.productMap['acai-cascao'].variants[0].price, 1300);
  const shake = data.productMap['acai-milkshake'].variants.map(function (variant) {
    return variant.price;
  });
  assert.deepEqual(shake, [1200, 1500, 1700, 2000]);
});

test('mantém os preços das bebidas exatamente como cadastrados', function () {
  assert.equal(data.productMap.agua.variants[0].price, 250);
  assert.equal(data.productMap['agua-gas'].variants[0].price, 300);
  assert.equal(data.productMap['coca-lata'].variants[0].price, 500);
  assert.equal(data.productMap['coca-600'].variants[0].price, 700);
  assert.equal(data.productMap['coca-1l'].variants[0].price, 1000);
  assert.equal(data.productMap['coca-2l'].variants[0].price, 1500);
  assert.equal(data.productMap.bananinha.variants[0].price, 300);
});

test('organiza todos os produtos nas três categorias', function () {
  assert.equal(data.categories.length, 3);
  assert.equal(data.products.length, 17);
  assert.equal(data.products.filter(function (product) {
    return product.categoryId === 'tradicionais';
  }).length, 5);
  assert.equal(data.products.filter(function (product) {
    return product.categoryId === 'acai-leitinho';
  }).length, 5);
  assert.equal(data.products.filter(function (product) {
    return product.categoryId === 'bebidas';
  }).length, 7);
});

test('cada produto tem um nome de exibição único no cardápio', function () {
  const names = data.products.map(function (product) {
    return product.fullName;
  });
  assert.equal(new Set(names).size, names.length);
});

test('adiciona sorvete tradicional de 300 ml por R$ 9,00', function () {
  const cart = add([], 'trad-copo', '300', 'morango-baunilha', 1);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].unitPrice, 900);
  assert.equal(cart[0].subtotal, 900);
  assert.equal(cart[0].flavorLabel, 'Morango e Baunilha');
  assert.equal(cart[0].variantLabel, '300 ml');
});

test('adiciona açaí de 500 ml por R$ 17,00', function () {
  const cart = add([], 'acai-copo', '500', 'acai', 1);
  assert.equal(cart[0].unitPrice, 1700);
  assert.equal(cart[0].flavorLabel, 'Açaí');
  assert.equal(cart[0].variantLabel, '500 ml');
});

test('mescla apenas itens com produto, tamanho e sabor idênticos', function () {
  let cart = add([], 'trad-copo', '300', 'morango-baunilha', 1);
  cart = add(cart, 'trad-copo', '300', 'morango-baunilha', 2);
  cart = add(cart, 'trad-copo', '500', 'morango-baunilha', 1);
  cart = add(cart, 'trad-copo', '300', 'chocolate-leite-condensado', 1);
  assert.equal(cart.length, 3);
  assert.equal(cart[0].quantity, 3);
  assert.equal(cart[0].subtotal, 2700);
  assert.equal(cart[1].quantity, 1);
  assert.equal(cart[2].flavorId, 'chocolate-leite-condensado');
});

test('atualiza quantidades, limita o máximo e remove itens', function () {
  let cart = add([], 'agua', 'unico', null, 1);
  const key = cart[0].key;
  cart = core.updateQuantity(cart, key, 4);
  assert.equal(cart[0].quantity, 4);
  assert.equal(cart[0].subtotal, 1000);
  cart = core.updateQuantity(cart, key, 200);
  assert.equal(cart[0].quantity, data.maxQuantity);
  cart = core.updateQuantity(cart, key, 0);
  assert.equal(cart.length, 0);
  const other = add([], 'bananinha', 'unico', null, 2);
  assert.equal(core.removeFromCart(other, other[0].key).length, 0);
});

test('reidrata o carrinho pelos preços cadastrados ignorando valores adulterados', function () {
  const normalized = core.normalizeCart([
    {
      productId: 'trad-copo',
      variantId: '300',
      flavorId: 'morango-baunilha',
      qty: 3,
      unitPrice: 1,
      subtotal: 3
    },
    {
      productId: 'produto-inexistente',
      variantId: '300',
      flavorId: 'morango-baunilha',
      qty: 1
    }
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].quantity, 3);
  assert.equal(normalized[0].unitPrice, 900);
  assert.equal(normalized[0].subtotal, 2700);
});

test('não exibe mais o sabor Uva e Nata e rejeita sabores removidos', function () {
  assert.equal(data.flavorMap['uva-nata'], undefined);
  assert.equal(data.categoryMap.tradicionais.flavorIds.indexOf('uva-nata'), -1);
  assert.throws(function () {
    add([], 'trad-copo', '300', 'uva-nata', 1);
  }, /Produto inválido/);
  assert.throws(function () {
    add([], 'trad-copo', '300', 'acai', 1);
  }, /Produto inválido/);
});

test('mantém o limite de sabores explícito e configurado por produto', function () {
  [
    'trad-copo',
    'trad-taca',
    'trad-casquinha',
    'trad-cascao',
    'trad-milkshake',
    'acai-copo',
    'acai-taca',
    'acai-casquinha',
    'acai-cascao',
    'acai-milkshake'
  ].forEach(function (productId) {
    assert.equal(data.productMap[productId].maxFlavors, 1);
  });
  assert.throws(function () {
    core.addToCart([], {
      productId: 'trad-milkshake',
      variantId: '500',
      flavorIds: ['morango-baunilha', 'chocolate-leite-condensado'],
      qty: 1
    });
  }, /Produto inválido/);
});

test('suporta combinação de sabores quando o produto permite', function () {
  const product = data.productMap['trad-milkshake'];
  const originalLimit = product.maxFlavors;
  try {
    product.maxFlavors = 2;
    const cart = core.addToCart([], {
      productId: 'trad-milkshake',
      variantId: '500',
      flavorIds: ['chocolate-leite-condensado', 'morango-baunilha'],
      qty: 1
    }).cart;
    assert.deepEqual(cart[0].flavorIds, ['morango-baunilha', 'chocolate-leite-condensado']);
    assert.equal(cart[0].flavorLabel, 'Morango e Baunilha + Chocolate e Leite Condensado');
    assert.match(cart[0].key, /morango-baunilha\+chocolate-leite-condensado/);
    const message = core.buildWhatsAppMessage(validOrder({ cart: cart }));
    assert.match(message, /Sabores: Morango e Baunilha \+ Chocolate e Leite Condensado/);
    assert.match(message, /Valor unitário: R\$ 15,00/);

    const sameCombination = core.addToCart(cart, {
      productId: 'trad-milkshake',
      variantId: '500',
      flavorIds: ['morango-baunilha', 'chocolate-leite-condensado'],
      qty: 1
    }).cart;
    assert.equal(sameCombination.length, 1);
    assert.equal(sameCombination[0].quantity, 2);

    const differentSize = core.addToCart(cart, {
      productId: 'trad-milkshake',
      variantId: '700',
      flavorIds: ['morango-baunilha', 'chocolate-leite-condensado'],
      qty: 1
    }).cart;
    assert.equal(differentSize.length, 2);

    const repeatedFlavor = core.addToCart([], {
      productId: 'trad-milkshake',
      variantId: '500',
      flavorIds: ['morango-baunilha', 'morango-baunilha'],
      qty: 1
    }).cart;
    assert.deepEqual(repeatedFlavor[0].flavorIds, ['morango-baunilha']);
  } finally {
    product.maxFlavors = originalLimit;
  }
});

test('cadastra todas as taxas de entrega com os valores fornecidos', function () {
  const expected = {
    'setor-fora-lista': ['Setor que não está na lista', 800],
    'zona-sul-bela-vista': ['Zona Sul e Bela Vista', 1000],
    'marechal-multirao': ['Marechal e Multirão', 1000],
    condominios: ['Condomínios', 1000],
    'hospitais-reparticoes': ['Hospitais e Repartições Públicas', 800],
    'hoteis-br': ['Hotéis da BR', 1000],
    'hoteis-sem-br': ['Hotéis sem ser da BR', 800],
    'supremax-rical-entre-rios': ['Supremax, Rical e Entre Rios', 1500],
    'monte-cristo-2': ['Monte Cristo 2', 1000],
    'white-solder-prf': ['White Solder, PRF', 1000],
    'zaltana-jamary': ['Zaltana, Bairro Jamary', 2000],
    'aterro-sanitario': ['Aterro Sanitário', 2000],
    'taxa-compras': ['Taxas para fazer compras', 1500],
    'demais-setores': ['Demais setores', 800]
  };
  Object.keys(expected).forEach(function (id) {
    const zone = data.zoneMap[id];
    assert.ok(zone, 'taxa ausente: ' + id);
    assert.equal(zone.label, expected[id][0]);
    assert.equal(zone.fee, expected[id][1]);
  });
  assert.equal(data.deliveryZones.length, 14);
});

test('aplica as faixas de taxa de R$ 8, R$ 10, R$ 15 e R$ 20', function () {
  assert.equal(core.getDeliveryFee('delivery', 'demais-setores'), 800);
  assert.equal(core.getDeliveryFee('delivery', 'setor-fora-lista'), 800);
  assert.equal(core.getDeliveryFee('delivery', 'condominios'), 1000);
  assert.equal(core.getDeliveryFee('delivery', 'monte-cristo-2'), 1000);
  assert.equal(core.getDeliveryFee('delivery', 'supremax-rical-entre-rios'), 1500);
  assert.equal(core.getDeliveryFee('delivery', 'taxa-compras'), 1500);
  assert.equal(core.getDeliveryFee('delivery', 'zaltana-jamary'), 2000);
  assert.equal(core.getDeliveryFee('delivery', 'aterro-sanitario'), 2000);
  assert.equal(core.getDeliveryFee('delivery', null), null);
});

test('não cobra entrega no consumo no local', function () {
  const totals = core.computeTotals(sampleCart(), { mode: 'local', zoneId: 'zaltana-jamary' });
  assert.equal(totals.deliveryFee, 0);
  assert.equal(totals.total, 1900);
  assert.equal(totals.feePending, false);
  assert.equal(totals.zone, null);
});

test('calcula subtotal, taxa única e total final', function () {
  const delivery = core.computeTotals(sampleCart(), {
    mode: 'delivery',
    zoneId: 'zona-sul-bela-vista'
  });
  assert.equal(delivery.subtotal, 1900);
  assert.equal(delivery.deliveryFee, 1000);
  assert.equal(delivery.total, 2900);
  assert.equal(delivery.itemCount, 3);

  const pending = core.computeTotals(sampleCart(), { mode: 'delivery', zoneId: '' });
  assert.equal(pending.feePending, true);
  assert.equal(pending.deliveryFee, 0);
  assert.equal(pending.total, 1900);
});

test('gera mensagem completa do WhatsApp com endereço, itens, taxa e total', function () {
  const message = core.buildWhatsAppMessage(validOrder());
  assert.match(message, /^\*🍦 NOVO PEDIDO — SORVETERIA BAMBOLINE\*/);
  assert.match(message, /\*Cliente:\* Maria Souza/);
  assert.match(message, /\*Telefone:\* \(69\) 99999-9999/);
  assert.match(message, /\*Tipo de pedido:\* Delivery/);
  assert.match(message, /\*Setor:\* Zona Sul e Bela Vista/);
  assert.match(message, /\*Rua:\* Rua das Flores/);
  assert.match(message, /\*Número:\* 120/);
  assert.match(message, /\*Bairro:\* Bela Vista/);
  assert.match(message, /\*Complemento:\* Casa 2/);
  assert.match(message, /\*Referência:\* Perto da praça/);
  assert.match(message, /1x Copo de sorvete — 300 ml/);
  assert.match(message, /Sabor: Morango e Baunilha/);
  assert.match(message, /Valor unitário: R\$ 9,00/);
  assert.match(message, /2x Coca-Cola lata/);
  assert.match(message, /Valor unitário: R\$ 5,00/);
  assert.match(message, /Subtotal: R\$ 10,00/);
  assert.match(message, /\*Subtotal dos produtos:\* R\$ 19,00/);
  assert.match(message, /\*Taxa de entrega:\* R\$ 10,00/);
  assert.match(message, /\*TOTAL DO PEDIDO:\* R\$ 29,00/);
  assert.match(message, /\*Observações:\* Sem talheres/);
  assert.match(message, /cardápio digital da Sorveteria Bamboline/);
});

test('omite endereço e taxa no pedido de consumo no local', function () {
  const message = core.buildWhatsAppMessage(validOrder({
    mode: 'local',
    zoneId: '',
    address: {},
    notes: ''
  }));
  assert.match(message, /\*Tipo de pedido:\* Consumo no local/);
  assert.doesNotMatch(message, /ENDEREÇO DE ENTREGA/);
  assert.doesNotMatch(message, /\*Setor:\*/);
  assert.match(message, /\*Taxa de entrega:\* R\$ 0,00/);
  assert.match(message, /\*TOTAL DO PEDIDO:\* R\$ 19,00/);
  assert.doesNotMatch(message, /\*Observações:\*/);
});

test('codifica a mensagem e usa o WhatsApp principal em formato internacional', function () {
  const order = validOrder();
  const message = core.buildWhatsAppMessage(order);
  const url = core.buildOrderUrl(order);
  assert.equal(data.store.whatsapp.primary.digits, '5569993522704');
  assert.match(url, /^https:\/\/wa\.me\/5569993522704\?text=/);
  assert.doesNotMatch(url.split('?')[0], /[\s()+-]/);
  const encoded = url.split('?text=')[1];
  assert.equal(decodeURIComponent(encoded), message);
  assert.match(encoded, /%0A/);
});

test('valida carrinho, setor, nome e telefone antes de gerar a mensagem', function () {
  assert.throws(function () {
    core.buildWhatsAppMessage(validOrder({ cart: [] }));
  }, /carrinho está vazio/);
  assert.throws(function () {
    core.buildWhatsAppMessage(validOrder({ zoneId: '' }));
  }, /setor de entrega/);
  assert.throws(function () {
    core.buildWhatsAppMessage(validOrder({ customerName: '' }));
  }, /nome do cliente/);
  assert.throws(function () {
    core.buildWhatsAppMessage(validOrder({ phone: '' }));
  }, /telefone de contato/);
});

test('formata telefone brasileiro com DDD', function () {
  assert.equal(core.formatPhoneInput('69993522704'), '(69) 99352-2704');
  assert.equal(core.formatPhoneInput('6933334444'), '(69) 3333-4444');
  assert.equal(core.formatPhoneInput('69'), '(69');
});

test('identifica aberto e fechado no fuso de Ariquemes', function () {
  const open = core.getStoreStatus(new Date('2026-10-21T19:00:00Z'));
  assert.equal(open.open, true);
  assert.equal(open.statusLabel, 'Aberto agora');
  assert.equal(open.closeLabel, '23h');

  const beforeOpening = core.getStoreStatus(new Date('2026-10-21T12:00:00Z'));
  assert.equal(beforeOpening.open, false);
  assert.equal(beforeOpening.detail, 'Abre hoje às 15h');

  const mondayOpen = core.getStoreStatus(new Date('2026-10-19T23:30:00Z'));
  assert.equal(mondayOpen.open, true);
  assert.equal(mondayOpen.closeLabel, '22h');

  const mondayClosed = core.getStoreStatus(new Date('2026-10-20T02:30:00Z'));
  assert.equal(mondayClosed.open, false);
  assert.equal(mondayClosed.detail, 'Abre amanhã às 15h');
});

test('normaliza texto para busca de setor sem acentos', function () {
  assert.equal(core.normalizeText('  Repartições Públicas '), 'reparticoes publicas');
  assert.equal(core.normalizeText('Multirão'), 'multirao');
});
