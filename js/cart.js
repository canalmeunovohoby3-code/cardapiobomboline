(function (root) {
  'use strict';

  const B = root.BAMBOLINE = root.BAMBOLINE || {};

  function getData() {
    if (!B.data) {
      throw new Error('Os dados do cardápio não foram carregados.');
    }
    return B.data;
  }

  function formatBRL(cents) {
    const numeric = Number(cents);
    const value = Number.isFinite(numeric) ? Math.round(numeric) : 0;
    const negative = value < 0;
    const absolute = Math.abs(value);
    const reais = Math.floor(absolute / 100);
    const centavos = String(absolute % 100).padStart(2, '0');
    const grouped = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negative ? '-' : '') + 'R$ ' + grouped + ',' + centavos;
  }

  function formatHourLabel(time) {
    const parts = String(time || '00:00').split(':');
    const hours = Number(parts[0]) || 0;
    const minutes = Number(parts[1]) || 0;
    return hours + 'h' + (minutes ? String(minutes).padStart(2, '0') : '');
  }

  function clampQuantity(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return 1;
    }
    const max = getData().maxQuantity;
    return Math.min(max, Math.max(1, Math.floor(number)));
  }

  function findProduct(productId) {
    return getData().productMap[productId] || null;
  }

  function findCategory(categoryId) {
    return getData().categoryMap[categoryId] || null;
  }

  function findFlavor(flavorId) {
    return getData().flavorMap[flavorId] || null;
  }

  function findVariant(product, variantId) {
    if (!product || !Array.isArray(product.variants)) {
      return null;
    }
    if (!variantId && product.variants.length === 1) {
      return product.variants[0];
    }
    return product.variants.find(function (variant) {
      return variant.id === variantId;
    }) || null;
  }

  function findZone(zoneId) {
    return getData().zoneMap[zoneId] || null;
  }

  function makeKey(productId, variantId, flavorIds) {
    const flavorKey = Array.isArray(flavorIds) ? flavorIds.join('+') : (flavorIds || '-');
    return [productId, variantId || '-', flavorKey || '-'].join('::');
  }

  function resolveLine(input) {
    if (!input) {
      return null;
    }
    const product = findProduct(input.productId);
    if (!product) {
      return null;
    }
    const category = findCategory(product.categoryId);
    if (!category) {
      return null;
    }
    const variant = findVariant(product, input.variantId);
    if (!variant || !Number.isInteger(variant.price) || variant.price < 0) {
      return null;
    }
    const allowedFlavorIds = Array.isArray(product.flavorIds) && product.flavorIds.length > 0
      ? product.flavorIds
      : category.flavorIds;
    let flavors = [];
    if (allowedFlavorIds.length > 0) {
      const requested = Array.isArray(input.flavorIds)
        ? input.flavorIds
        : (input.flavorId ? [input.flavorId] : []);
      const unique = [];
      requested.forEach(function (flavorId) {
        if (flavorId && unique.indexOf(flavorId) === -1) {
          unique.push(flavorId);
        }
      });
      const minFlavors = Math.max(1, Math.floor(Number(product.minFlavors) || 1));
      const maxFlavors = Math.max(minFlavors, Math.floor(Number(product.maxFlavors) || 1));
      if (unique.length < minFlavors || unique.length > maxFlavors) {
        return null;
      }
      flavors = unique.map(findFlavor);
      const valid = flavors.every(function (flavor) {
        return flavor && allowedFlavorIds.indexOf(flavor.id) !== -1;
      });
      if (!valid) {
        return null;
      }
      flavors.sort(function (first, second) {
        return allowedFlavorIds.indexOf(first.id) - allowedFlavorIds.indexOf(second.id);
      });
    }
    const flavorIds = flavors.map(function (flavor) {
      return flavor.id;
    });
    const flavorLabels = flavors.map(function (flavor) {
      return flavor.label;
    });
    const quantity = clampQuantity(input.qty != null ? input.qty : input.quantity);
    return {
      key: makeKey(product.id, variant.id, flavorIds),
      productId: product.id,
      variantId: variant.id,
      flavorId: flavorIds.length ? flavorIds[0] : null,
      flavorIds: flavorIds,
      quantity: quantity,
      name: product.name,
      fullName: product.fullName,
      orderName: product.orderName,
      categoryId: category.id,
      categoryLabel: category.label,
      flavorLabel: flavorLabels.length ? flavorLabels.join(' + ') : null,
      flavorLabels: flavorLabels,
      variantLabel: variant.label || null,
      unitPrice: variant.price,
      subtotal: variant.price * quantity,
      art: product.art
    };
  }

  function normalizeCart(raw) {
    if (!Array.isArray(raw)) {
      return [];
    }
    const merged = [];
    const index = new Map();
    raw.forEach(function (entry) {
      const line = resolveLine(entry);
      if (!line) {
        return;
      }
      if (index.has(line.key)) {
        const existing = merged[index.get(line.key)];
        existing.quantity = clampQuantity(existing.quantity + line.quantity);
        existing.subtotal = existing.unitPrice * existing.quantity;
        return;
      }
      index.set(line.key, merged.length);
      merged.push(line);
    });
    return merged;
  }

  function addToCart(cart, input) {
    const next = normalizeCart(cart);
    const line = resolveLine(input);
    if (!line) {
      throw new Error('Produto inválido.');
    }
    const existingIndex = next.findIndex(function (item) {
      return item.key === line.key;
    });
    let merged = false;
    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      existing.quantity = clampQuantity(existing.quantity + line.quantity);
      existing.subtotal = existing.unitPrice * existing.quantity;
      merged = true;
    } else {
      next.push(line);
    }
    return { cart: next, line: line, merged: merged };
  }

  function updateQuantity(cart, key, quantity) {
    const next = normalizeCart(cart);
    const number = Number(quantity);
    if (!Number.isFinite(number) || number <= 0) {
      return next.filter(function (line) {
        return line.key !== key;
      });
    }
    const line = next.find(function (item) {
      return item.key === key;
    });
    if (line) {
      line.quantity = clampQuantity(number);
      line.subtotal = line.unitPrice * line.quantity;
    }
    return next;
  }

  function removeFromCart(cart, key) {
    return normalizeCart(cart).filter(function (line) {
      return line.key !== key;
    });
  }

  function countItems(cart) {
    return normalizeCart(cart).reduce(function (total, line) {
      return total + line.quantity;
    }, 0);
  }

  function getDeliveryFee(mode, zoneId) {
    if (mode === 'local') {
      return 0;
    }
    const zone = findZone(zoneId);
    return zone ? zone.fee : null;
  }

  function computeTotals(cart, options) {
    const settings = options || {};
    const mode = settings.mode === 'local' ? 'local' : 'delivery';
    const zone = mode === 'delivery' ? findZone(settings.zoneId) : null;
    const itemCount = typeof settings.itemCount === 'number' ? settings.itemCount : null;
    const normalized = normalizeCart(cart);
    const subtotal = normalized.reduce(function (total, line) {
      return total + line.unitPrice * line.quantity;
    }, 0);
    const feePending = mode === 'delivery' && !zone;
    const deliveryFee = mode === 'local' ? 0 : (zone ? zone.fee : 0);
    const count = itemCount === null ? normalized.reduce(function (total, line) {
      return total + line.quantity;
    }, 0) : itemCount;
    return {
      mode: mode,
      zone: zone,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: subtotal + deliveryFee,
      feePending: feePending,
      itemCount: count
    };
  }

  function onlyDigits(value) {
    return String(value == null ? '' : value).replace(/\D/g, '');
  }

  function formatPhoneInput(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (!digits) {
      return '';
    }
    if (digits.length <= 2) {
      return '(' + digits;
    }
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (rest.length <= 4) {
      return '(' + ddd + ') ' + rest;
    }
    if (digits.length <= 10) {
      return '(' + ddd + ') ' + rest.slice(0, 4) + '-' + rest.slice(4);
    }
    return '(' + ddd + ') ' + rest.slice(0, 5) + '-' + rest.slice(5);
  }

  function normalizeText(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getStoreStatus(date) {
    const store = getData().store;
    const now = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: store.timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    const parts = formatter.formatToParts(now).reduce(function (acc, part) {
      acc[part.type] = part.value;
      return acc;
    }, {});
    const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayIndex = weekdayIndex[parts.weekday];
    const hour = Number(parts.hour) || 0;
    const minute = Number(parts.minute) || 0;
    const minutes = hour * 60 + minute;
    const schedule = store.hours[dayIndex];
    let open = false;
    let closeLabel = null;
    if (schedule) {
      const openParts = schedule.open.split(':');
      const closeParts = schedule.close.split(':');
      const openMinutes = Number(openParts[0]) * 60 + Number(openParts[1]);
      const closeMinutes = Number(closeParts[0]) * 60 + Number(closeParts[1]);
      open = minutes >= openMinutes && minutes < closeMinutes;
      closeLabel = formatHourLabel(schedule.close);
    }
    let nextOpening = null;
    if (!open) {
      const names = store.weekdayNames;
      for (let offset = 0; offset <= 7; offset += 1) {
        const day = (dayIndex + offset) % 7;
        const daySchedule = store.hours[day];
        if (!daySchedule) {
          continue;
        }
        const openParts = daySchedule.open.split(':');
        const openMinutes = Number(openParts[0]) * 60 + Number(openParts[1]);
        if (offset === 0 && minutes >= openMinutes) {
          continue;
        }
        const timeLabel = formatHourLabel(daySchedule.open);
        if (offset === 0) {
          nextOpening = 'hoje às ' + timeLabel;
        } else if (offset === 1) {
          nextOpening = 'amanhã às ' + timeLabel;
        } else {
          nextOpening = names[day] + ' às ' + timeLabel;
        }
        break;
      }
    }
    return {
      open: open,
      dayIndex: dayIndex,
      minutes: minutes,
      schedule: schedule,
      closeLabel: closeLabel,
      nextOpening: nextOpening,
      statusLabel: open ? 'Aberto agora' : 'Fechado agora',
      detail: open ? 'Fecha às ' + closeLabel : (nextOpening ? 'Abre ' + nextOpening : 'Confira os horários')
    };
  }

  function buildWhatsAppMessage(order) {
    const payload = order || {};
    const lines = normalizeCart(payload.cart);
    if (lines.length === 0) {
      throw new Error('O carrinho está vazio.');
    }
    const mode = payload.mode === 'local' ? 'local' : 'delivery';
    const zone = mode === 'delivery' ? findZone(payload.zoneId) : null;
    if (mode === 'delivery' && !zone) {
      throw new Error('Selecione o setor de entrega.');
    }
    const name = String(payload.customerName || '').trim();
    const phone = String(payload.phone || '').trim();
    if (!name) {
      throw new Error('Informe o nome do cliente.');
    }
    if (!phone) {
      throw new Error('Informe o telefone de contato.');
    }
    const address = payload.address || {};
    const notes = String(payload.notes || '').trim();
    const totals = computeTotals(lines, { mode: mode, zoneId: zone ? zone.id : null });
    const message = [];
    message.push('*🍦 NOVO PEDIDO — SORVETERIA BAMBOLINE*');
    message.push('');
    message.push('*Cliente:* ' + name);
    message.push('*Telefone:* ' + phone);
    message.push('');
    message.push('*Tipo de pedido:* ' + (mode === 'local' ? 'Consumo no local' : 'Delivery'));
    message.push('');
    if (mode === 'delivery') {
      message.push('*📍 ENDEREÇO DE ENTREGA*');
      message.push('*Setor:* ' + zone.label);
      message.push('*Rua:* ' + String(address.street || '').trim());
      message.push('*Número:* ' + String(address.number || '').trim());
      message.push('*Bairro:* ' + String(address.neighborhood || '').trim());
      if (String(address.complement || '').trim()) {
        message.push('*Complemento:* ' + String(address.complement).trim());
      }
      if (String(address.reference || '').trim()) {
        message.push('*Referência:* ' + String(address.reference).trim());
      }
      message.push('');
    }
    message.push('*🛒 ITENS DO PEDIDO*');
    message.push('');
    lines.forEach(function (line, index) {
      const heading = line.orderName + (line.variantLabel ? ' — ' + line.variantLabel : '');
      message.push(line.quantity + 'x ' + heading);
      if (line.flavorLabels && line.flavorLabels.length > 1) {
        message.push('Sabores: ' + line.flavorLabels.join(' + '));
      } else if (line.flavorLabel) {
        message.push('Sabor: ' + line.flavorLabel);
      }
      message.push('Valor unitário: ' + formatBRL(line.unitPrice));
      message.push('Subtotal: ' + formatBRL(line.unitPrice * line.quantity));
      if (index < lines.length - 1) {
        message.push('');
      }
    });
    message.push('');
    message.push('*Subtotal dos produtos:* ' + formatBRL(totals.subtotal));
    message.push('*Taxa de entrega:* ' + formatBRL(totals.deliveryFee));
    message.push('*TOTAL DO PEDIDO:* ' + formatBRL(totals.total));
    if (notes) {
      message.push('');
      message.push('*Observações:* ' + notes);
    }
    message.push('');
    message.push('*Pedido enviado pelo cardápio digital da Sorveteria Bamboline.*');
    return message.join('\n');
  }

  function buildWhatsAppUrl(phone, message) {
    const digits = onlyDigits(phone);
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
  }

  function buildOrderUrl(order, phone) {
    const store = getData().store;
    const destination = phone || store.whatsapp.primary.digits;
    return buildWhatsAppUrl(destination, buildWhatsAppMessage(order));
  }

  const core = {
    formatBRL: formatBRL,
    formatHourLabel: formatHourLabel,
    formatPhoneInput: formatPhoneInput,
    onlyDigits: onlyDigits,
    normalizeText: normalizeText,
    resolveLine: resolveLine,
    normalizeCart: normalizeCart,
    addToCart: addToCart,
    updateQuantity: updateQuantity,
    removeFromCart: removeFromCart,
    countItems: countItems,
    computeTotals: computeTotals,
    getDeliveryFee: getDeliveryFee,
    getStoreStatus: getStoreStatus,
    buildWhatsAppMessage: buildWhatsAppMessage,
    buildWhatsAppUrl: buildWhatsAppUrl,
    buildOrderUrl: buildOrderUrl
  };

  B.core = core;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
