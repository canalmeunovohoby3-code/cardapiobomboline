(function () {
  'use strict';

  const B = window.BAMBOLINE;
  if (!B || !B.data || !B.core || !B.art) {
    return;
  }

  const data = B.data;
  const core = B.core;
  const art = B.art;
  const STORAGE_KEY = 'bamboline.cart.v1';

  const MENU_GROUPS = [
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'acai-leitinho', label: 'Açaí e Leitinho' },
    { id: 'milk-shakes', label: 'Milk-shakes' },
    { id: 'casquinhas', label: 'Casquinhas e Cascões' },
    { id: 'bebidas', label: 'Bebidas' }
  ];

  const HIDDEN_FROM_MENU = new Set([
    'trad-taca',
    'trad-casquinha',
    'trad-cascao',
    'acai-copo',
    'acai-taca',
    'acai-casquinha',
    'acai-cascao',
    'acai-milkshake',
    'bananinha'
  ]);

  const VISIBLE_PRODUCTS = data.products.filter(function (product) {
    return !HIDDEN_FROM_MENU.has(product.id);
  });

  const VISIBLE_GROUPS = MENU_GROUPS.filter(function (group) {
    return VISIBLE_PRODUCTS.some(function (product) {
      return productGroupId(product) === group.id;
    });
  });

  const MENU_FILTERS = [{ id: 'todos', label: 'Todos' }].concat(VISIBLE_GROUPS.map(function (group) {
    return { id: group.id, label: group.label };
  }));

  const searchIndex = new Map();

  const state = {
    cart: [],
    product: null,
    activeLayer: null,
    status: null,
    menu: {
      filter: 'todos',
      query: ''
    },
    checkout: {
      mode: 'delivery',
      zoneId: '',
      comboOpen: false,
      filteredZones: [],
      activeZoneIndex: -1,
      successUrl: null
    },
    toastTimer: null
  };

  const el = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function currency(cents) {
    return core.formatBRL(cents);
  }

  function quantityLabel(count) {
    return count + (count === 1 ? ' item' : ' itens');
  }

  function readStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
      return core.normalizeCart(items);
    } catch (error) {
      return [];
    }
  }

  function writeStorage() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        items: state.cart.map(function (line) {
          return {
            productId: line.productId,
            variantId: line.variantId,
            flavorId: line.flavorId,
            flavorIds: line.flavorIds || [],
            qty: line.quantity
          };
        })
      }));
    } catch (error) {
      return;
    }
  }

  function hydrateStore() {
    const store = data.store;
    document.querySelectorAll('[data-store-address]').forEach(function (node) {
      node.textContent = store.address.full;
    });
    document.querySelectorAll('[data-store-map]').forEach(function (node) {
      node.setAttribute('href', store.address.mapsUrl);
    });
    document.querySelectorAll('[data-whatsapp-primary]').forEach(function (node) {
      node.setAttribute('href', 'https://wa.me/' + store.whatsapp.primary.digits);
    });
    document.querySelectorAll('[data-whatsapp-primary-label]').forEach(function (node) {
      node.textContent = store.whatsapp.primary.display;
    });
    document.querySelectorAll('[data-instagram]').forEach(function (node) {
      node.setAttribute('href', store.instagram.url);
    });
    document.querySelectorAll('[data-instagram-label]').forEach(function (node) {
      node.textContent = store.instagram.handle;
    });
    const hoursList = document.querySelector('[data-hours-list]');
    if (hoursList) {
      hoursList.innerHTML = store.hoursDisplay.map(function (entry) {
        return '<div class="hours-row"><span>' + escapeHtml(entry.days) + '</span><strong>' + escapeHtml(entry.hours) + '</strong></div>';
      }).join('');
    }
    const year = byId('current-year');
    if (year) {
      year.textContent = new Date().getFullYear();
    }
  }

  function refreshStatus() {
    const status = core.getStoreStatus(new Date());
    state.status = status;
    const hours = status.schedule
      ? 'Hoje, ' + core.formatHourLabel(status.schedule.open) + '–' + core.formatHourLabel(status.schedule.close)
      : 'Confira os horários';
    document.querySelectorAll('[data-header-status]').forEach(function (node) {
      node.textContent = status.open ? 'Aberto' : 'Fechado';
    });
    document.querySelectorAll('[data-header-hours]').forEach(function (node) {
      node.textContent = hours;
    });
    document.querySelectorAll('[data-store-status]').forEach(function (node) {
      node.classList.toggle('is-open', status.open);
      node.classList.toggle('is-closed', !status.open);
      node.setAttribute('title', status.statusLabel + ' · ' + status.detail);
    });
    if (el.closedNotice) {
      el.closedNotice.hidden = status.open;
    }
    updateCheckoutHoursNote();
  }

  function updateCheckoutHoursNote() {
    if (!el.checkoutHoursNote) {
      return;
    }
    if (state.status && !state.status.open) {
      el.checkoutHoursNote.innerHTML = '<div class="checkout-hours-note">A loja está fora do horário de atendimento agora. Você pode enviar o pedido, mas a confirmação e a entrega dependerão do funcionamento.</div>';
    } else {
      el.checkoutHoursNote.innerHTML = '';
    }
  }

  function productGroupId(product) {
    if (product.categoryId === 'bebidas') {
      return 'bebidas';
    }
    if (product.art === 'milkshake') {
      return 'milk-shakes';
    }
    if (product.art === 'casquinha' || product.art === 'cascao') {
      return 'casquinhas';
    }
    if (product.categoryId === 'acai-leitinho') {
      return 'acai-leitinho';
    }
    return 'sorvetes';
  }

  function groupById(groupId) {
    return MENU_GROUPS.find(function (group) {
      return group.id === groupId;
    }) || MENU_GROUPS[0];
  }

  function searchTextFor(product) {
    if (searchIndex.has(product.id)) {
      return searchIndex.get(product.id);
    }
    const category = getCategory(product);
    const group = groupById(productGroupId(product));
    const flavorLabels = category.flavorIds.map(function (flavorId) {
      return data.flavorMap[flavorId].label;
    });
    const variantLabels = product.variants.map(function (variant) {
      return variant.label;
    }).filter(Boolean);
    const aliases = [];
    if (product.art === 'milkshake') {
      aliases.push('milk shake milkshake milkshakes');
    }
    if (product.art === 'casquinha' || product.art === 'cascao') {
      aliases.push('casquinha casquinhas cascao cascoes cascões cone cones');
    }
    if (category.id === 'bebidas') {
      aliases.push('bebida bebidas');
    }
    if (category.id === 'tradicionais') {
      aliases.push('tradicional tradicionais sorvete sorvetes');
    }
    if (category.id === 'acai-leitinho') {
      aliases.push('acai leitinho');
    }
    const text = core.normalizeText([
      product.name,
      product.fullName,
      product.orderName,
      product.description,
      category.label,
      category.shortLabel,
      group.label,
      flavorLabels.join(' '),
      variantLabels.join(' '),
      aliases.join(' ')
    ].join(' '));
    searchIndex.set(product.id, text);
    return text;
  }

  function previewFlavorFor(product) {
    const category = getCategory(product);
    if (!category.flavorIds.length) {
      return null;
    }
    let total = 0;
    for (let index = 0; index < product.id.length; index += 1) {
      total += product.id.charCodeAt(index);
    }
    return category.flavorIds[total % category.flavorIds.length];
  }

  function cardTag(product) {
    if (product.categoryId === 'tradicionais') {
      return 'Tradicional';
    }
    if (product.categoryId === 'acai-leitinho') {
      return 'Açaí e Leitinho';
    }
    return product.id === 'bananinha' ? 'Acompanhamento' : 'Bebida';
  }

  function cardMeta(product) {
    const category = getCategory(product);
    const parts = [];
    if (category.flavorIds.length) {
      parts.push(category.flavorIds.length + (category.flavorIds.length === 1 ? ' sabor' : ' sabores'));
    }
    if (product.variants.length > 1) {
      parts.push(product.variants.length + ' tamanhos');
    }
    return parts.length ? parts.join(' · ') : product.description;
  }

  function isQuickAdd(product) {
    const category = getCategory(product);
    return Boolean(category) && category.flavorIds.length === 0 && product.variants.length === 1;
  }

  function cardArt(product, previewFlavor) {
    if (Array.isArray(product.gallery) && product.gallery.length > 1) {
      return '<span class="catalog-photo-carousel">' + product.gallery.map(function (src, index) {
        const alt = index === 0 ? escapeHtml(product.imageAlt || product.fullName) : '';
        return [
          '<span class="catalog-photo-carousel__slide">',
          '<img class="product-art catalog-photo-carousel__image" src="' + escapeHtml(src) + '" alt="' + alt + '" loading="eager"' + (index === 0 ? ' fetchpriority="high"' : '') + ' decoding="async">',
          '</span>'
        ].join('');
      }).join('') + '</span>';
    }
    return art.getProductArt(product, previewFlavor, 'product-art');
  }

  function renderCard(product) {
    const category = getCategory(product);
    const previewFlavor = previewFlavorFor(product);
    const theme = art.getTheme(product, previewFlavor);
    const prices = product.variants.map(function (variant) {
      return variant.price;
    });
    const minPrice = Math.min.apply(null, prices);
    const hasMultiple = product.variants.length > 1;
    const quickAdd = isQuickAdd(product);
    const addLabel = quickAdd
      ? 'Adicionar ' + product.fullName + ' ao carrinho'
      : 'Escolher opções de ' + product.fullName;
    return [
      '<article class="catalog-card" data-card-product="' + escapeHtml(product.id) + '">',
      '<button class="catalog-card__open" type="button" data-product-open="' + escapeHtml(product.id) + '" aria-label="Ver opções de ' + escapeHtml(product.fullName) + '" aria-haspopup="dialog">',
      '<span class="catalog-card__media' + (product.image ? ' catalog-card__media--photo' : '') + '" style="--art-bg:' + theme.bg + ';--art-bg2:' + theme.bg2 + '">',
      '<span class="catalog-card__tag">' + escapeHtml(cardTag(product)) + '</span>',
      cardArt(product, previewFlavor),
      '</span>',
      '<span class="catalog-card__body">',
      '<span class="catalog-card__title">' + escapeHtml(product.fullName) + '</span>',
      '<span class="catalog-card__meta">' + escapeHtml(cardMeta(product)) + '</span>',
      '<span class="catalog-card__foot">',
      '<span class="catalog-card__price">' + (hasMultiple ? '<small>A partir de</small>' : '') + '<strong>' + currency(minPrice) + '</strong></span>',
      '</span>',
      '</span>',
      '</button>',
      '<button class="catalog-card__add" type="button" data-product-add="' + escapeHtml(product.id) + '" aria-label="' + escapeHtml(addLabel) + '"><span aria-hidden="true">+</span></button>',
      '</article>'
    ].join('');
  }

  function renderSection(group, products, options) {
    const settings = options || {};
    const title = settings.title || group.label;
    const headingId = 'catalog-heading-' + group.id;
    return [
      '<section class="catalog-section" data-menu-group="' + escapeHtml(group.id) + '" aria-labelledby="' + headingId + '">',
      '<header class="catalog-section__head">',
      '<h2 class="catalog-section__title" id="' + headingId + '">' + escapeHtml(title) + '</h2>',
      '<span class="catalog-section__count">' + products.length + (products.length === 1 ? ' produto' : ' produtos') + '</span>',
      '</header>',
      '<div class="catalog-grid">',
      products.map(renderCard).join(''),
      '</div>',
      '</section>'
    ].join('');
  }

  function renderEmptyState() {
    return [
      '<div class="catalog-empty">',
      '<span class="catalog-empty__icon" aria-hidden="true">',
      '<svg width="25" height="25" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.7" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4.2 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      '</span>',
      '<h2>Nenhum produto encontrado</h2>',
      '<p>Tente buscar por outro nome, sabor ou categoria do cardápio.</p>',
      '<button class="btn btn--primary" type="button" data-clear-search>Limpar busca</button>',
      '</div>'
    ].join('');
  }

  function renderMenu() {
    const query = state.menu.query.trim();
    const normalizedQuery = core.normalizeText(query);
    let html = '';
    let summary = '';
    let total = 0;

    if (normalizedQuery) {
      const products = VISIBLE_PRODUCTS.filter(function (product) {
        return searchTextFor(product).indexOf(normalizedQuery) !== -1;
      });
      total = products.length;
      summary = total
        ? total + (total === 1 ? ' resultado' : ' resultados') + ' para “' + query + '”'
        : 'Nenhum resultado para “' + query + '”';
      html = total
        ? renderSection({ id: 'search', label: 'Resultados' }, products, { title: 'Resultados' })
        : renderEmptyState();
    } else if (state.menu.filter !== 'todos') {
      const group = groupById(state.menu.filter);
      const products = VISIBLE_PRODUCTS.filter(function (product) {
        return productGroupId(product) === group.id;
      });
      total = products.length;
      summary = total + (total === 1 ? ' produto' : ' produtos') + ' em ' + group.label;
      html = total ? renderSection(group, products) : renderEmptyState();
    } else {
      total = VISIBLE_PRODUCTS.length;
      summary = total + ' produtos disponíveis';
      html = renderSection({ id: 'todos', label: 'Todos os produtos' }, VISIBLE_PRODUCTS, { title: 'Todos os produtos' });
    }

    el.menuSections.innerHTML = html;
    if (el.catalogSummary) {
      el.catalogSummary.textContent = summary;
    }
  }

  function syncFilterChips() {
    document.querySelectorAll('[data-menu-filter]').forEach(function (button) {
      const active = button.getAttribute('data-menu-filter') === state.menu.filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderFilterChips() {
    el.categoryNav.innerHTML = MENU_FILTERS.map(function (filter) {
      const active = filter.id === state.menu.filter;
      return '<button class="filter-chip' + (active ? ' is-active' : '') + '" type="button" data-menu-filter="' + escapeHtml(filter.id) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + escapeHtml(filter.label) + '</button>';
    }).join('');
  }

  function updateSearchClear() {
    if (el.searchClear && el.searchInput) {
      el.searchClear.hidden = el.searchInput.value.length === 0;
    }
  }

  function scrollCatalogToStart() {
    window.requestAnimationFrame(function () {
      if (!el.menuSections) {
        return;
      }
      const headerHeight = el.header ? el.header.offsetHeight : 68;
      const categoryHeight = el.categorySticky ? el.categorySticky.offsetHeight : 50;
      const target = el.menuSections.getBoundingClientRect().top + window.scrollY - headerHeight - categoryHeight - 10;
      if (window.scrollY > target + 4) {
        window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    });
  }

  function setMenuFilter(filterId) {
    const allowed = MENU_FILTERS.some(function (filter) {
      return filter.id === filterId;
    });
    if (!allowed) {
      return;
    }
    state.menu.filter = filterId;
    state.menu.query = '';
    if (el.searchInput) {
      el.searchInput.value = '';
    }
    updateSearchClear();
    syncFilterChips();
    renderMenu();
    scrollCatalogToStart();
  }

  function clearSearch(focusSearch) {
    state.menu.query = '';
    state.menu.filter = 'todos';
    if (el.searchInput) {
      el.searchInput.value = '';
    }
    updateSearchClear();
    syncFilterChips();
    renderMenu();
    if (focusSearch !== false && el.searchInput) {
      el.searchInput.focus({ preventScroll: true });
    }
    scrollCatalogToStart();
  }

  function quickAddProduct(product) {
    try {
      const result = core.addToCart(state.cart, {
        productId: product.id,
        variantId: product.variants[0].id,
        flavorId: null,
        qty: 1
      });
      state.cart = result.cart;
      writeStorage();
      renderCart();
      bumpCart();
      showToast('1x ' + result.line.orderName + ' no carrinho');
    } catch (error) {
      showToast('Não foi possível adicionar este item.');
    }
  }

  function getProduct(productId) {
    return data.productMap[productId] || null;
  }

  function getCategory(product) {
    return data.categoryMap[product.categoryId] || null;
  }

  function selectedVariant() {
    if (!state.product) {
      return null;
    }
    const product = getProduct(state.product.productId);
    if (!product) {
      return null;
    }
    if (product.variants.length === 1) {
      return product.variants[0];
    }
    return product.variants.find(function (variant) {
      return variant.id === state.product.variantId;
    }) || null;
  }

  function flavorLimit(product, category) {
    if (!product || !category || category.flavorIds.length === 0) {
      return 0;
    }
    return Math.max(1, Math.min(Number(product.maxFlavors) || 1, category.flavorIds.length));
  }

  function paintProductMedia() {
    if (!state.product) {
      return;
    }
    const product = getProduct(state.product.productId);
    if (!product) {
      return;
    }
    const previewFlavor = state.product.flavorIds[0] || null;
    const theme = art.getTheme(product, previewFlavor);
    el.pdMedia.style.setProperty('--art-bg', theme.bg);
    el.pdMedia.style.setProperty('--art-bg2', theme.bg2);
    el.pdMedia.innerHTML = art.getProductArt(product, previewFlavor);
  }

  function syncFlavorChoices() {
    if (!state.product) {
      return;
    }
    const product = getProduct(state.product.productId);
    const category = getCategory(product);
    if (!product || !category) {
      return;
    }
    const maxFlavors = flavorLimit(product, category);
    const selectedCount = state.product.flavorIds.length;
    el.pdFlavorOptions.querySelectorAll('input[name="pd-flavor"]').forEach(function (input) {
      if (input.type === 'checkbox') {
        input.disabled = !input.checked && selectedCount >= maxFlavors;
      }
    });
    if (maxFlavors > 1) {
      el.pdFlavorCounter.hidden = false;
      el.pdFlavorCounter.textContent = selectedCount + ' de ' + maxFlavors + ' sabores selecionados';
    } else {
      el.pdFlavorCounter.hidden = true;
      el.pdFlavorCounter.textContent = '';
    }
  }

  function updateProductModal() {
    if (!state.product) {
      return;
    }
    const product = getProduct(state.product.productId);
    if (!product) {
      return;
    }
    const category = getCategory(product);
    const variant = selectedVariant();
    const needsFlavor = category.flavorIds.length > 0;
    const needsSize = product.variants.length > 1;
    const maxFlavors = flavorLimit(product, category);
    const selectedCount = state.product.flavorIds.length;
    const canAdd = (!needsFlavor || selectedCount > 0) && (!needsSize || Boolean(variant));
    el.pdFlavorsHeading.textContent = maxFlavors > 1 ? 'Escolha até ' + maxFlavors + ' sabores' : 'Escolha o sabor';
    el.pdQuantityValue.textContent = state.product.quantity;
    el.pdMinus.disabled = state.product.quantity <= 1;
    el.pdPlus.disabled = state.product.quantity >= data.maxQuantity;
    el.pdTotal.textContent = variant ? currency(variant.price * state.product.quantity) : '—';
    el.pdAdd.disabled = !canAdd;
    syncFlavorChoices();
    if (!needsFlavor || selectedCount > 0) {
      if (!needsSize || variant) {
        el.pdAdd.textContent = 'Adicionar · ' + currency(variant.price * state.product.quantity);
      } else {
        el.pdAdd.textContent = 'Escolha o tamanho';
      }
    } else {
      el.pdAdd.textContent = 'Escolha o sabor';
    }
  }

  function renderFlavorChoices(product, category) {
    const maxFlavors = flavorLimit(product, category);
    const inputType = maxFlavors > 1 ? 'checkbox' : 'radio';
    el.pdFlavorOptions.innerHTML = category.flavorIds.map(function (flavorId) {
      const flavor = data.flavorMap[flavorId];
      return [
        '<label class="choice choice--flavor" style="--swatch:' + art.getFlavorSwatch(flavorId) + '">',
        '<input type="' + inputType + '" name="pd-flavor" value="' + escapeHtml(flavorId) + '">',
        '<span class="choice__swatch" aria-hidden="true"></span>',
        '<span class="choice__label">' + escapeHtml(flavor.label) + '</span>',
        maxFlavors > 1 ? '<span class="choice__mark" aria-hidden="true">✓</span>' : '',
        '</label>'
      ].join('');
    }).join('');
  }

  function renderSizeChoices(product) {
    el.pdSizeOptions.innerHTML = product.variants.map(function (variant) {
      return [
        '<label class="choice choice--size">',
        '<input type="radio" name="pd-size" value="' + escapeHtml(variant.id) + '">',
        '<span class="choice__label">' + escapeHtml(variant.label) + '</span>',
        '<span class="choice__size-price">' + currency(variant.price) + '</span>',
        '</label>'
      ].join('');
    }).join('');
  }

  function openProduct(productId, trigger) {
    const product = getProduct(productId);
    if (!product) {
      return;
    }
    const category = getCategory(product);
    state.product = {
      productId: product.id,
      flavorIds: [],
      variantId: product.variants.length === 1 ? product.variants[0].id : null,
      quantity: 1
    };
    el.pdCategory.textContent = category.label;
    el.pdTitle.textContent = product.fullName;
    el.pdDescription.textContent = product.description;
    el.pdFlavors.hidden = category.flavorIds.length === 0;
    el.pdSizes.hidden = product.variants.length <= 1;
    renderFlavorChoices(product, category);
    renderSizeChoices(product);
    paintProductMedia();
    updateProductModal();
    openLayer('product', trigger);
  }

  function addProductToCart() {
    if (!state.product) {
      return;
    }
    const product = getProduct(state.product.productId);
    if (!product) {
      return;
    }
    const category = getCategory(product);
    const variant = selectedVariant();
    if (category.flavorIds.length > 0 && state.product.flavorIds.length === 0) {
      return;
    }
    if (!variant) {
      return;
    }
    try {
      const result = core.addToCart(state.cart, {
        productId: product.id,
        variantId: variant.id,
        flavorIds: state.product.flavorIds.slice(),
        qty: state.product.quantity
      });
      state.cart = result.cart;
      writeStorage();
      renderCart();
      closeLayer('product');
      bumpCart();
      const added = result.line;
      showToast(added.quantity + 'x ' + added.orderName + ' no carrinho');
    } catch (error) {
      showToast('Não foi possível adicionar este item.');
    }
  }

  function showToast(message) {
    if (!el.toastRegion) {
      return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    el.toastRegion.replaceChildren(toast);
    window.requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 240);
    }, 2800);
  }

  function bumpCart() {
    if (!el.cartOpen) {
      return;
    }
    el.cartOpen.classList.remove('is-bumping');
    void el.cartOpen.offsetWidth;
    el.cartOpen.classList.add('is-bumping');
    window.setTimeout(function () {
      el.cartOpen.classList.remove('is-bumping');
    }, 500);
  }

  const layerConfig = {};

  function initLayers() {
    layerConfig.cart = {
      overlay: el.cartOverlay,
      initialFocus: el.cartOverlay.querySelector('button[data-close-cart]'),
      returnFocus: null
    };
    layerConfig.product = {
      overlay: el.productOverlay,
      initialFocus: el.productOverlay.querySelector('button[data-close-product]'),
      returnFocus: null
    };
    layerConfig.checkout = {
      overlay: el.checkoutOverlay,
      initialFocus: el.checkoutOverlay.querySelector('button[data-close-checkout]'),
      returnFocus: null
    };
  }

  function dismissToast() {
    if (!el.toastRegion) {
      return;
    }
    window.clearTimeout(state.toastTimer);
    state.toastTimer = null;
    el.toastRegion.replaceChildren();
  }

  function openLayer(name, returnElement) {
    const config = layerConfig[name];
    if (!config) {
      return;
    }
    dismissToast();
    if (state.activeLayer && state.activeLayer !== name) {
      closeLayer(state.activeLayer, false);
    }
    const trigger = returnElement || document.activeElement;
    config.returnFocus = trigger && trigger.focus ? trigger : null;
    state.activeLayer = name;
    config.overlay.classList.add('is-open');
    config.overlay.removeAttribute('inert');
    config.overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll', 'has-layer');
    window.requestAnimationFrame(function () {
      if (config.initialFocus && document.contains(config.initialFocus)) {
        config.initialFocus.focus({ preventScroll: true });
      }
    });
  }

  function closeLayer(name, restoreFocus) {
    const config = layerConfig[name];
    if (!config) {
      return;
    }
    config.overlay.classList.remove('is-open');
    config.overlay.setAttribute('aria-hidden', 'true');
    config.overlay.setAttribute('inert', '');
    if (state.activeLayer === name) {
      state.activeLayer = null;
      document.body.classList.remove('no-scroll', 'has-layer');
    }
    if (restoreFocus !== false && config.returnFocus && document.contains(config.returnFocus)) {
      window.setTimeout(function () {
        config.returnFocus.focus({ preventScroll: true });
      }, 60);
    }
  }

  function closeActiveLayer() {
    if (state.activeLayer) {
      closeLayer(state.activeLayer);
    }
  }

  function trapFocus(event) {
    if (!state.activeLayer) {
      return;
    }
    const overlay = layerConfig[state.activeLayer].overlay;
    const focusable = Array.from(overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function (node) {
      return node.getClientRects().length > 0 && !node.closest('[inert]');
    });
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function cartLineOptions(line) {
    const options = [];
    if (line.flavorLabel) {
      options.push(line.flavorLabel);
    }
    if (line.variantLabel) {
      options.push(line.variantLabel);
    }
    return options.length ? options.join(' · ') : line.categoryLabel;
  }

  function renderCart() {
    refreshCartIndicators();
    if (state.cart.length === 0) {
      el.cartBody.innerHTML = [
        '<div class="cart-empty">',
        '<span class="cart-empty__art" aria-hidden="true">',
        '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 8h14l-1.2 10.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        '</span>',
        '<h3>Seu carrinho está vazio</h3>',
        '<p>Escolha seu sabor favorito no cardápio e monte o pedido do seu jeito.</p>',
        '<button class="btn btn--primary" type="button" data-cart-browse>Ver cardápio</button>',
        '</div>'
      ].join('');
      el.cartFooter.innerHTML = '';
      return;
    }

    const items = state.cart.map(function (line) {
      const product = getProduct(line.productId);
      if (!product) {
        return '';
      }
      const theme = art.getTheme(product, line.flavorId);
      const options = cartLineOptions(line);
      return [
        '<li class="cart-item">',
        '<span class="cart-item__art" style="--art-bg:' + theme.bg + ';--art-bg2:' + theme.bg2 + '">',
        art.getProductArt(product, line.flavorId, 'cart-art'),
        '</span>',
        '<div class="cart-item__info">',
        '<div class="cart-item__top">',
        '<p class="cart-item__name">' + escapeHtml(line.orderName) + '</p>',
        '<button class="cart-item__remove" type="button" data-cart-action="remove" data-key="' + escapeHtml(line.key) + '" aria-label="Remover ' + escapeHtml(line.orderName) + ' do carrinho">',
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        '</button>',
        '</div>',
        '<p class="cart-item__options">' + escapeHtml(options) + '</p>',
        '<div class="cart-item__bottom">',
        '<div class="stepper" aria-label="Quantidade de ' + escapeHtml(line.orderName) + '">',
        '<button class="stepper__button" type="button" data-cart-action="decrease" data-key="' + escapeHtml(line.key) + '" aria-label="Diminuir quantidade" ' + (line.quantity <= 1 ? 'disabled' : '') + '>−</button>',
        '<span class="stepper__value" aria-live="polite">' + line.quantity + '</span>',
        '<button class="stepper__button" type="button" data-cart-action="increase" data-key="' + escapeHtml(line.key) + '" aria-label="Aumentar quantidade">+</button>',
        '</div>',
        '<div class="cart-item__price">',
        '<small>' + currency(line.unitPrice) + ' cada</small>',
        '<strong>' + currency(line.subtotal) + '</strong>',
        '</div>',
        '</div>',
        '</div>',
        '</li>'
      ].join('');
    }).join('');

    el.cartBody.innerHTML = '<ul class="cart-list">' + items + '</ul>';

    const totals = core.computeTotals(state.cart, {
      mode: state.checkout.mode,
      zoneId: state.checkout.zoneId
    });
    let feeValue;
    let feeClass = '';
    let feeNote;
    if (totals.mode === 'local') {
      feeValue = currency(0);
      feeNote = 'Consumo no local — sem taxa de entrega.';
    } else if (totals.zone) {
      feeValue = currency(totals.deliveryFee);
      feeNote = 'Entrega para ' + totals.zone.label + '. Taxa cobrada uma única vez por pedido.';
    } else {
      feeValue = 'A calcular';
      feeClass = ' class="summary-line__pending"';
      feeNote = 'Informe o setor na finalização para calcular a entrega.';
    }

    el.cartFooter.innerHTML = [
      '<div class="cart-summary">',
      '<div class="summary-line"><span>Subtotal</span><strong>' + currency(totals.subtotal) + '</strong></div>',
      '<div class="summary-line"><span>Taxa de entrega</span><strong' + feeClass + '>' + feeValue + '</strong></div>',
      '<div class="summary-line summary-line--total"><span>' + (totals.feePending ? 'Total parcial' : 'Total') + '</span><strong>' + currency(totals.total) + '</strong></div>',
      '<p class="cart-fee-note">' + escapeHtml(feeNote) + '</p>',
      '</div>',
      '<div class="cart-actions">',
      '<button class="btn btn--primary" type="button" data-cart-checkout>Finalizar pedido</button>',
      '<button class="cart-continue" type="button" data-cart-continue>Continuar comprando</button>',
      '</div>'
    ].join('');
  }

  function refreshCartIndicators() {
    const totals = core.computeTotals(state.cart, {
      mode: state.checkout.mode,
      zoneId: state.checkout.zoneId
    });
    const count = totals.itemCount;
    document.querySelectorAll('[data-cart-count]').forEach(function (node) {
      node.textContent = count;
    });
    document.querySelectorAll('[data-cart-summary]').forEach(function (node) {
      node.textContent = quantityLabel(count);
    });
    document.querySelectorAll('[data-cart-total]').forEach(function (node) {
      node.textContent = currency(totals.total);
    });
    if (el.cartOpen) {
      el.cartOpen.setAttribute('aria-label', 'Abrir carrinho, ' + quantityLabel(count));
    }
    if (el.mobileCart) {
      const visible = count > 0;
      el.mobileCart.classList.toggle('is-visible', visible);
      el.mobileCart.setAttribute('aria-hidden', visible ? 'false' : 'true');
      document.body.classList.toggle('has-mobile-cart', visible);
    }
  }

  function changeCartQuantity(key, delta) {
    const line = state.cart.find(function (item) {
      return item.key === key;
    });
    if (!line) {
      return;
    }
    state.cart = core.updateQuantity(state.cart, key, line.quantity + delta);
    writeStorage();
    renderCart();
  }

  function removeCartLine(key) {
    state.cart = core.removeFromCart(state.cart, key);
    writeStorage();
    renderCart();
    showToast('Item removido do carrinho');
  }

  function openCart(trigger) {
    renderCart();
    openLayer('cart', trigger);
  }

  function closeCartAndBrowse() {
    const target = byId('cardapio');
    closeLayer('cart');
    window.setTimeout(function () {
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 160);
  }

  function openCheckout() {
    if (state.cart.length === 0) {
      showToast('Adicione itens ao carrinho antes de finalizar.');
      return;
    }
    closeLayer('cart', false);
    hideOrderSuccess();
    syncCheckoutMode();
    restoreZoneDisplay();
    renderCheckoutSummary();
    openLayer('checkout', el.cartOpen);
  }

  function hideOrderSuccess() {
    if (el.checkoutSuccess) {
      el.checkoutSuccess.hidden = true;
    }
    if (el.checkoutFallback) {
      el.checkoutFallback.hidden = true;
      el.checkoutFallback.removeAttribute('href');
    }
    state.checkout.successUrl = null;
  }

  function syncCheckoutMode() {
    const isDelivery = state.checkout.mode === 'delivery';
    el.checkoutForm.querySelectorAll('input[name="service-mode"]').forEach(function (radio) {
      radio.checked = radio.value === state.checkout.mode;
    });
    if (el.addressSection) {
      el.addressSection.hidden = !isDelivery;
    }
    [el.streetInput, el.numberInput, el.neighborhoodInput].forEach(function (input) {
      if (input) {
        input.required = isDelivery;
      }
    });
    if (!isDelivery) {
      closeZoneCombo(false);
      clearFieldError('sector');
      clearFieldError('street');
      clearFieldError('number');
      clearFieldError('neighborhood');
    }
  }

  function restoreZoneDisplay() {
    const zone = data.zoneMap[state.checkout.zoneId];
    if (zone) {
      state.checkout.zoneId = zone.id;
      el.zoneHidden.value = zone.id;
      el.zoneValue.textContent = zone.label;
      el.zoneValue.classList.remove('is-placeholder');
    } else {
      state.checkout.zoneId = '';
      el.zoneHidden.value = '';
      el.zoneValue.textContent = 'Selecione o setor';
      el.zoneValue.classList.add('is-placeholder');
    }
  }

  function fieldBindings() {
    return {
      name: { input: el.nameInput, error: el.nameError },
      phone: { input: el.phoneInput, error: el.phoneError },
      sector: { input: el.sectorTrigger, error: el.sectorError },
      street: { input: el.streetInput, error: el.streetError },
      number: { input: el.numberInput, error: el.numberError },
      neighborhood: { input: el.neighborhoodInput, error: el.neighborhoodError }
    };
  }

  function setFieldError(key, message) {
    const binding = fieldBindings()[key];
    if (!binding || !binding.input || !binding.error) {
      return;
    }
    binding.input.classList.add('is-invalid');
    binding.input.setAttribute('aria-invalid', 'true');
    binding.error.textContent = message;
    binding.error.hidden = false;
  }

  function clearFieldError(key) {
    const binding = fieldBindings()[key];
    if (!binding || !binding.input || !binding.error) {
      return;
    }
    binding.input.classList.remove('is-invalid');
    binding.input.removeAttribute('aria-invalid');
    binding.error.textContent = '';
    binding.error.hidden = true;
  }

  function clearAllFieldErrors() {
    Object.keys(fieldBindings()).forEach(clearFieldError);
  }

  function focusField(key) {
    const binding = fieldBindings()[key];
    if (!binding || !binding.input) {
      return;
    }
    binding.input.focus({ preventScroll: true });
    binding.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function validateCheckout() {
    clearAllFieldErrors();
    const errors = [];
    const name = el.nameInput.value.trim();
    const phone = el.phoneInput.value.trim();
    const digits = core.onlyDigits(phone);
    const mode = state.checkout.mode;

    if (name.length < 2) {
      setFieldError('name', 'Informe seu nome.');
      errors.push('name');
    }
    if (!digits) {
      setFieldError('phone', 'Informe seu telefone para contato.');
      errors.push('phone');
    } else if (digits.length !== 10 && digits.length !== 11) {
      setFieldError('phone', 'Informe um telefone com DDD.');
      errors.push('phone');
    }

    if (mode === 'delivery') {
      const zone = data.zoneMap[state.checkout.zoneId];
      if (!zone) {
        setFieldError('sector', 'Selecione o setor de entrega.');
        errors.push('sector');
      }
      const street = el.streetInput.value.trim();
      const number = el.numberInput.value.trim();
      const neighborhood = el.neighborhoodInput.value.trim();
      if (street.length < 2) {
        setFieldError('street', 'Informe a rua.');
        errors.push('street');
      }
      if (!number) {
        setFieldError('number', 'Informe o número.');
        errors.push('number');
      }
      if (neighborhood.length < 2) {
        setFieldError('neighborhood', 'Informe o bairro.');
        errors.push('neighborhood');
      }
    }

    if (errors.length) {
      focusField(errors[0]);
      showToast('Confira os campos destacados.');
      return null;
    }

    return {
      name: name,
      phone: phone,
      mode: mode,
      zoneId: mode === 'delivery' ? state.checkout.zoneId : null,
      address: {
        street: mode === 'delivery' ? el.streetInput.value.trim() : '',
        number: mode === 'delivery' ? el.numberInput.value.trim() : '',
        neighborhood: mode === 'delivery' ? el.neighborhoodInput.value.trim() : '',
        complement: mode === 'delivery' ? el.complementInput.value.trim() : '',
        reference: mode === 'delivery' ? el.referenceInput.value.trim() : ''
      },
      notes: el.notesInput.value.trim()
    };
  }

  function checkoutAddressLine() {
    const street = el.streetInput.value.trim();
    const number = el.numberInput.value.trim();
    const neighborhood = el.neighborhoodInput.value.trim();
    const complement = el.complementInput.value.trim();
    const reference = el.referenceInput.value.trim();
    let line = '';
    if (street) {
      line = street;
    }
    if (number) {
      line += (line ? ', ' : 'Nº ') + number;
    }
    if (neighborhood) {
      line += (line ? ' — ' : '') + neighborhood;
    }
    if (complement) {
      line += (line ? ' · ' : '') + complement;
    }
    if (reference) {
      line += (line ? ' · Ref.: ' : 'Ref.: ') + reference;
    }
    return line;
  }

  function renderCheckoutMeta(totals) {
    if (!el.checkoutMeta) {
      return;
    }
    if (totals.mode === 'local') {
      el.checkoutMeta.innerHTML = [
        '<span class="checkout-summary__meta-label">Consumo no local</span>',
        '<p>Sem endereço de entrega e sem taxa.</p>'
      ].join('');
      return;
    }
    const zoneLabel = totals.zone ? totals.zone.label : 'Setor ainda não selecionado';
    const addressLine = checkoutAddressLine() || 'Informe rua, número e bairro.';
    el.checkoutMeta.innerHTML = [
      '<span class="checkout-summary__meta-label">Delivery</span>',
      '<p>' + escapeHtml(zoneLabel) + '</p>',
      '<p>' + escapeHtml(addressLine) + '</p>'
    ].join('');
  }

  function checkoutSummaryItems() {
    return state.cart.map(function (line) {
      const options = [];
      if (line.flavorLabel) {
        options.push(line.flavorLabel);
      }
      if (line.variantLabel) {
        options.push(line.variantLabel);
      }
      return [
        '<li class="checkout-summary__item">',
        '<span class="checkout-summary__qty">' + line.quantity + 'x</span>',
        '<div class="checkout-summary__item-info">',
        '<strong>' + escapeHtml(line.orderName) + '</strong>',
        options.length ? '<small>' + escapeHtml(options.join(' · ')) + '</small>' : '',
        '</div>',
        '<span class="checkout-summary__item-price">' + currency(line.subtotal) + '</span>',
        '</li>'
      ].join('');
    }).join('');
  }

  function renderCheckoutSummary() {
    if (!el.checkoutItems || !el.checkoutTotals) {
      return;
    }
    const totals = core.computeTotals(state.cart, {
      mode: state.checkout.mode,
      zoneId: state.checkout.zoneId
    });
    const countNode = el.checkoutModal.querySelector('[data-checkout-count]');
    if (countNode) {
      countNode.textContent = quantityLabel(totals.itemCount);
    }
    el.checkoutItems.innerHTML = state.cart.length
      ? '<ul class="checkout-items-list">' + checkoutSummaryItems() + '</ul>'
      : '<p class="checkout-empty">Seu carrinho está vazio.</p>';
    renderCheckoutMeta(totals);

    let feeValue;
    let feeClass = '';
    let feeNote;
    if (totals.mode === 'local') {
      feeValue = currency(0);
      feeNote = 'Consumo no local — sem taxa de entrega.';
    } else if (totals.zone) {
      feeValue = currency(totals.deliveryFee);
      feeNote = 'Setor: ' + totals.zone.label + '. Taxa cobrada uma única vez por pedido.';
    } else {
      feeValue = 'A calcular';
      feeClass = ' class="summary-line__pending"';
      feeNote = 'Escolha o setor para incluir a taxa no total.';
    }

    el.checkoutTotals.innerHTML = [
      '<div class="summary-line"><span>Subtotal</span><strong>' + currency(totals.subtotal) + '</strong></div>',
      '<div class="summary-line"><span>Taxa de entrega</span><strong' + feeClass + '>' + feeValue + '</strong></div>',
      '<div class="summary-line summary-line--total"><span>' + (totals.feePending ? 'Total parcial' : 'Total') + '</span><strong>' + currency(totals.total) + '</strong></div>',
      '<p class="checkout-fee-note">' + escapeHtml(feeNote) + '</p>'
    ].join('');
    if (el.checkoutSubmit) {
      el.checkoutSubmit.disabled = state.cart.length === 0;
    }
    refreshCartIndicators();
  }

  function filterZones() {
    const query = core.normalizeText(el.sectorSearch.value);
    return data.deliveryZones.filter(function (zone) {
      return core.normalizeText(zone.label).indexOf(query) !== -1;
    });
  }

  function paintActiveZone() {
    const options = Array.from(el.sectorOptions.querySelectorAll('[role="option"]'));
    options.forEach(function (option, index) {
      option.classList.toggle('is-active', index === state.checkout.activeZoneIndex);
    });
    const active = options[state.checkout.activeZoneIndex];
    if (active) {
      el.sectorSearch.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else {
      el.sectorSearch.removeAttribute('aria-activedescendant');
    }
  }

  function renderZoneOptions() {
    const zones = filterZones();
    state.checkout.filteredZones = zones;
    el.sectorOptions.innerHTML = zones.map(function (zone) {
      return [
        '<li class="combo__option" id="zone-option-' + escapeHtml(zone.id) + '" role="option" tabindex="-1" data-zone-id="' + escapeHtml(zone.id) + '" aria-selected="' + (zone.id === state.checkout.zoneId ? 'true' : 'false') + '">',
        '<span>' + escapeHtml(zone.label) + '</span>',
        '<span class="combo__option-fee">' + currency(zone.fee) + '</span>',
        '</li>'
      ].join('');
    }).join('');
    el.sectorEmpty.hidden = zones.length > 0;
    const selectedIndex = zones.findIndex(function (zone) {
      return zone.id === state.checkout.zoneId;
    });
    state.checkout.activeZoneIndex = selectedIndex >= 0 ? selectedIndex : (zones.length ? 0 : -1);
    paintActiveZone();
  }

  function openZoneCombo() {
    if (state.checkout.comboOpen) {
      return;
    }
    state.checkout.comboOpen = true;
    el.sectorSearch.value = '';
    el.sectorPanel.hidden = false;
    el.sectorTrigger.setAttribute('aria-expanded', 'true');
    renderZoneOptions();
    window.requestAnimationFrame(function () {
      el.sectorSearch.focus({ preventScroll: true });
    });
  }

  function closeZoneCombo(focusTrigger) {
    if (!state.checkout.comboOpen) {
      return;
    }
    state.checkout.comboOpen = false;
    el.sectorPanel.hidden = true;
    el.sectorTrigger.setAttribute('aria-expanded', 'false');
    el.sectorSearch.removeAttribute('aria-activedescendant');
    if (focusTrigger) {
      el.sectorTrigger.focus({ preventScroll: true });
    }
  }

  function selectZone(zoneId) {
    const zone = data.zoneMap[zoneId];
    if (!zone) {
      return;
    }
    state.checkout.zoneId = zone.id;
    el.zoneHidden.value = zone.id;
    el.zoneValue.textContent = zone.label;
    el.zoneValue.classList.remove('is-placeholder');
    clearFieldError('sector');
    hideOrderSuccess();
    closeZoneCombo(true);
    renderCheckoutSummary();
  }

  function moveActiveZone(direction) {
    const zones = state.checkout.filteredZones;
    if (!zones.length) {
      return;
    }
    state.checkout.activeZoneIndex = (state.checkout.activeZoneIndex + direction + zones.length) % zones.length;
    paintActiveZone();
  }

  function openWhatsApp(url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    if (state.cart.length === 0) {
      showToast('Seu carrinho está vazio.');
      renderCart();
      return;
    }
    const values = validateCheckout();
    if (!values) {
      return;
    }
    const payload = {
      cart: state.cart,
      customerName: values.name,
      phone: values.phone,
      mode: values.mode,
      zoneId: values.zoneId,
      address: values.address,
      notes: values.notes
    };
    let url;
    try {
      url = core.buildOrderUrl(payload);
    } catch (error) {
      showToast(error.message || 'Não foi possível preparar o pedido.');
      return;
    }
    state.checkout.successUrl = url;
    el.checkoutFallback.href = url;
    el.checkoutFallback.hidden = false;
    el.checkoutSuccess.hidden = false;
    openWhatsApp(url);
    showToast('Pedido preparado. Envie a mensagem no WhatsApp.');
    el.checkoutSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateNotesCount() {
    if (el.notesCount && el.notesInput) {
      el.notesCount.textContent = el.notesInput.value.length + '/' + el.notesInput.maxLength;
    }
  }

  function applyMode(mode) {
    state.checkout.mode = mode === 'local' ? 'local' : 'delivery';
    syncCheckoutMode();
    hideOrderSuccess();
    renderCheckoutSummary();
  }

  function setupEvents() {
    el.menuSections.addEventListener('click', function (event) {
      const addButton = event.target.closest('[data-product-add]');
      if (addButton) {
        const product = getProduct(addButton.getAttribute('data-product-add'));
        if (!product) {
          return;
        }
        if (isQuickAdd(product)) {
          quickAddProduct(product);
        } else {
          openProduct(product.id, addButton);
        }
        return;
      }
      const openButton = event.target.closest('[data-product-open]');
      if (openButton) {
        openProduct(openButton.getAttribute('data-product-open'), openButton);
        return;
      }
      if (event.target.closest('[data-clear-search]')) {
        clearSearch(false);
      }
    });

    el.categoryNav.addEventListener('click', function (event) {
      const chip = event.target.closest('[data-menu-filter]');
      if (chip) {
        setMenuFilter(chip.getAttribute('data-menu-filter'));
      }
    });

    el.searchInput.addEventListener('input', function () {
      state.menu.query = el.searchInput.value;
      if (state.menu.query.trim() && state.menu.filter !== 'todos') {
        state.menu.filter = 'todos';
        syncFilterChips();
      }
      updateSearchClear();
      renderMenu();
    });

    el.searchClear.addEventListener('click', function () {
      clearSearch(true);
    });

    el.cartOpen.addEventListener('click', function () {
      openCart(el.cartOpen);
    });

    if (el.mobileCartOpen) {
      el.mobileCartOpen.addEventListener('click', function () {
        openCart(el.mobileCartOpen);
      });
    }

    el.cartOverlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-cart]')) {
        closeLayer('cart');
        return;
      }
      const action = event.target.closest('[data-cart-action]');
      if (action) {
        const key = action.getAttribute('data-key');
        const type = action.getAttribute('data-cart-action');
        if (type === 'increase') {
          changeCartQuantity(key, 1);
        } else if (type === 'decrease') {
          changeCartQuantity(key, -1);
        } else if (type === 'remove') {
          removeCartLine(key);
        }
        return;
      }
      if (event.target.closest('[data-cart-checkout]')) {
        openCheckout();
        return;
      }
      if (event.target.closest('[data-cart-continue]')) {
        closeLayer('cart');
        return;
      }
      if (event.target.closest('[data-cart-browse]')) {
        closeCartAndBrowse();
      }
    });

    el.productOverlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-product]')) {
        closeLayer('product');
      }
    });

    el.pdFlavors.addEventListener('change', function (event) {
      if (!state.product || event.target.name !== 'pd-flavor') {
        return;
      }
      const product = getProduct(state.product.productId);
      const category = getCategory(product);
      if (!product || !category) {
        return;
      }
      const maxFlavors = flavorLimit(product, category);
      if (event.target.type === 'checkbox') {
        const selected = Array.from(el.pdFlavorOptions.querySelectorAll('input[name="pd-flavor"]:checked')).map(function (input) {
          return input.value;
        });
        if (selected.length > maxFlavors) {
          event.target.checked = false;
          showToast('Escolha até ' + maxFlavors + ' sabores.');
          return;
        }
        state.product.flavorIds = selected;
      } else {
        state.product.flavorIds = event.target.checked ? [event.target.value] : [];
      }
      paintProductMedia();
      updateProductModal();
    });

    el.pdSizes.addEventListener('change', function (event) {
      if (!state.product || event.target.name !== 'pd-size') {
        return;
      }
      state.product.variantId = event.target.value;
      updateProductModal();
    });

    el.pdMinus.addEventListener('click', function () {
      if (!state.product) {
        return;
      }
      state.product.quantity = Math.max(1, state.product.quantity - 1);
      updateProductModal();
    });

    el.pdPlus.addEventListener('click', function () {
      if (!state.product) {
        return;
      }
      state.product.quantity = Math.min(data.maxQuantity, state.product.quantity + 1);
      updateProductModal();
    });

    el.pdAdd.addEventListener('click', addProductToCart);

    el.checkoutOverlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-checkout]')) {
        closeZoneCombo(false);
        closeLayer('checkout');
      }
    });

    el.checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    el.checkoutForm.querySelectorAll('input[name="service-mode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          applyMode(radio.value);
        }
      });
    });

    [
      [el.nameInput, 'name'],
      [el.streetInput, 'street'],
      [el.numberInput, 'number'],
      [el.neighborhoodInput, 'neighborhood']
    ].forEach(function (entry) {
      entry[0].addEventListener('input', function () {
        clearFieldError(entry[1]);
        hideOrderSuccess();
      });
    });

    el.phoneInput.addEventListener('input', function () {
      el.phoneInput.value = core.formatPhoneInput(el.phoneInput.value);
      clearFieldError('phone');
      hideOrderSuccess();
    });

    [el.complementInput, el.referenceInput].forEach(function (input) {
      input.addEventListener('input', hideOrderSuccess);
    });

    [el.streetInput, el.numberInput, el.neighborhoodInput, el.complementInput, el.referenceInput].forEach(function (input) {
      input.addEventListener('input', function () {
        if (state.checkout.mode === 'delivery') {
          renderCheckoutSummary();
        }
      });
    });

    el.notesInput.addEventListener('input', function () {
      updateNotesCount();
      hideOrderSuccess();
    });

    el.sectorTrigger.addEventListener('click', function () {
      if (state.checkout.comboOpen) {
        closeZoneCombo(true);
      } else {
        openZoneCombo();
      }
    });

    el.sectorTrigger.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openZoneCombo();
      }
    });

    el.sectorSearch.addEventListener('input', function () {
      renderZoneOptions();
    });

    el.sectorSearch.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveActiveZone(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveActiveZone(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const zone = state.checkout.filteredZones[state.checkout.activeZoneIndex];
        if (zone) {
          selectZone(zone.id);
        }
      } else if (event.key === 'Tab') {
        closeZoneCombo(false);
      }
    });

    el.sectorOptions.addEventListener('click', function (event) {
      const option = event.target.closest('[data-zone-id]');
      if (option) {
        selectZone(option.getAttribute('data-zone-id'));
      }
    });

    document.addEventListener('click', function (event) {
      if (state.checkout.comboOpen && !el.sectorCombo.contains(event.target)) {
        closeZoneCombo(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.activeLayer) {
        if (state.checkout.comboOpen) {
          event.preventDefault();
          closeZoneCombo(true);
          return;
        }
        event.preventDefault();
        closeActiveLayer();
      } else if (event.key === 'Tab' && state.activeLayer) {
        trapFocus(event);
      }
    });

    window.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        refreshStatus();
      }
    });

    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) {
        state.cart = readStorage();
        renderCart();
        if (el.checkoutOverlay.classList.contains('is-open')) {
          renderCheckoutSummary();
        }
      }
    });
  }

  function init() {
    el.header = document.querySelector('.app-header');
    el.categorySticky = document.querySelector('.category-sticky');
    el.menuSections = byId('menu-sections');
    el.categoryNav = byId('category-nav');
    el.searchInput = byId('menu-search');
    el.searchClear = byId('menu-search-clear');
    el.catalogSummary = byId('catalog-summary');
    el.closedNotice = byId('closed-notice');
    el.cartOpen = byId('cart-open');
    el.mobileCart = byId('mobile-cart');
    el.mobileCartOpen = byId('mobile-cart-open');
    el.cartOverlay = byId('cart-overlay');
    el.cartBody = byId('cart-body');
    el.cartFooter = byId('cart-footer');
    el.productOverlay = byId('product-overlay');
    el.pdCategory = byId('pd-category');
    el.pdTitle = byId('pd-title');
    el.pdDescription = byId('pd-description');
    el.pdMedia = byId('pd-media');
    el.pdFlavors = byId('pd-flavors');
    el.pdFlavorsHeading = byId('pd-flavors-heading');
    el.pdFlavorOptions = byId('pd-flavor-options');
    el.pdFlavorCounter = byId('pd-flavor-counter');
    el.pdSizes = byId('pd-sizes');
    el.pdSizeOptions = byId('pd-size-options');
    el.pdMinus = byId('pd-minus');
    el.pdPlus = byId('pd-plus');
    el.pdQuantityValue = byId('pd-quantity-value');
    el.pdTotal = byId('pd-total');
    el.pdAdd = byId('pd-add');
    el.checkoutOverlay = byId('checkout-overlay');
    el.checkoutModal = byId('checkout-modal');
    el.checkoutForm = byId('checkout-form');
    el.checkoutItems = byId('checkout-items');
    el.checkoutMeta = byId('checkout-meta');
    el.checkoutTotals = byId('checkout-totals');
    el.checkoutSuccess = byId('checkout-success');
    el.checkoutFallback = byId('checkout-fallback');
    el.checkoutSubmit = byId('checkout-submit');
    el.checkoutHoursNote = byId('checkout-hours-note');
    el.addressSection = byId('address-section');
    el.nameInput = byId('customer-name');
    el.phoneInput = byId('customer-phone');
    el.streetInput = byId('address-street');
    el.numberInput = byId('address-number');
    el.neighborhoodInput = byId('address-neighborhood');
    el.complementInput = byId('address-complement');
    el.referenceInput = byId('address-reference');
    el.notesInput = byId('order-notes');
    el.notesCount = byId('notes-count');
    el.nameError = byId('customer-name-error');
    el.phoneError = byId('customer-phone-error');
    el.streetError = byId('address-street-error');
    el.numberError = byId('address-number-error');
    el.neighborhoodError = byId('address-neighborhood-error');
    el.sectorCombo = byId('sector-combo');
    el.sectorTrigger = byId('sector-trigger');
    el.sectorPanel = byId('sector-panel');
    el.sectorSearch = byId('sector-search');
    el.sectorOptions = byId('sector-options');
    el.sectorEmpty = byId('sector-empty');
    el.sectorValue = byId('sector-value');
    el.zoneValue = el.sectorValue;
    el.zoneHidden = byId('delivery-zone');
    el.sectorError = byId('sector-error');
    el.toastRegion = byId('toast-region');

    if (!el.menuSections || !el.cartOverlay || !el.checkoutForm) {
      return;
    }

    state.cart = readStorage();
    hydrateStore();
    initLayers();
    renderFilterChips();
    updateSearchClear();
    renderMenu();
    renderCart();
    syncCheckoutMode();
    restoreZoneDisplay();
    renderCheckoutSummary();
    updateNotesCount();
    refreshStatus();
    setupEvents();
    window.setInterval(refreshStatus, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
