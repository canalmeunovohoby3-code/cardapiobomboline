(function (root) {
  'use strict';

  const B = root.BAMBOLINE = root.BAMBOLINE || {};
  const INK = '#3A2230';
  let artCounter = 0;

  const FLAVOR_THEMES = {
    'uva-nata': {
      bg: '#F3E7FA',
      bg2: '#E4CFF3',
      primary: '#8E59B8',
      secondary: '#FFF1D6',
      accent: '#6C3F91',
      swatch: 'linear-gradient(135deg, #8E59B8 0 52%, #FFF1D6 52% 100%)'
    },
    'morango-baunilha': {
      bg: '#FFE7EE',
      bg2: '#FFD2DF',
      primary: '#E15C86',
      secondary: '#FFF3DA',
      accent: '#C13D66',
      swatch: 'linear-gradient(135deg, #E15C86 0 52%, #FFF3DA 52% 100%)'
    },
    'chocolate-leite-condensado': {
      bg: '#F4E5D9',
      bg2: '#EAD3C0',
      primary: '#78472F',
      secondary: '#EFCE9D',
      accent: '#593321',
      swatch: 'linear-gradient(135deg, #78472F 0 52%, #EFCE9D 52% 100%)'
    },
    acai: {
      bg: '#EFE2F6',
      bg2: '#DFC9EF',
      primary: '#6B3B88',
      secondary: '#9D6DB8',
      accent: '#4E2A66',
      swatch: 'linear-gradient(135deg, #6B3B88 0 52%, #B58BCC 52% 100%)'
    },
    leitinho: {
      bg: '#FFF3DF',
      bg2: '#FBE4C3',
      primary: '#EAD3A7',
      secondary: '#FFF9EE',
      accent: '#B78F58',
      swatch: 'linear-gradient(135deg, #F7E9CC 0 52%, #FFFDF6 52% 100%)'
    }
  };

  const DRINK_THEMES = {
    water: {
      bg: '#E4F4F8',
      bg2: '#CDEAF2',
      primary: '#71BCD3',
      secondary: '#E8F8FC',
      accent: '#3E8DA6'
    },
    sparkling: {
      bg: '#E2F5F6',
      bg2: '#C9E9EC',
      primary: '#5FB5C0',
      secondary: '#EFFBFC',
      accent: '#347F89'
    },
    'cola-can': {
      bg: '#FBE3E4',
      bg2: '#F5C9CD',
      primary: '#D22E37',
      secondary: '#FFF6F2',
      accent: '#8F171E'
    },
    'cola-bottle': {
      bg: '#F8E6E3',
      bg2: '#EED0CA',
      primary: '#D22E37',
      secondary: '#59352A',
      accent: '#8F171E'
    },
    banana: {
      bg: '#FFF5D6',
      bg2: '#F7E5A9',
      primary: '#F1C94F',
      secondary: '#FFF6D8',
      accent: '#A97A24'
    }
  };

  const CATEGORY_THEMES = {
    tradicionais: FLAVOR_THEMES['morango-baunilha'],
    'acai-leitinho': FLAVOR_THEMES.acai,
    bebidas: DRINK_THEMES['cola-can']
  };

  function getTheme(product, flavorId) {
    if (flavorId && FLAVOR_THEMES[flavorId]) {
      return FLAVOR_THEMES[flavorId];
    }
    if (product && DRINK_THEMES[product.art]) {
      return DRINK_THEMES[product.art];
    }
    if (product && CATEGORY_THEMES[product.categoryId]) {
      return CATEGORY_THEMES[product.categoryId];
    }
    return FLAVOR_THEMES['morango-baunilha'];
  }

  function getFlavorSwatch(flavorId) {
    return FLAVOR_THEMES[flavorId] ? FLAVOR_THEMES[flavorId].swatch : 'linear-gradient(135deg, #E15C86, #FFF3DA)';
  }

  function frame(inner) {
    return [
      '<svg class="product-art" viewBox="0 0 220 220" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">',
      '<circle cx="110" cy="103" r="78" fill="#FFFFFF" opacity=".24"/>',
      '<circle cx="110" cy="103" r="87" fill="none" stroke="#3A2230" stroke-opacity=".11" stroke-width="1.5" stroke-dasharray="2 9"/>',
      inner,
      '</svg>'
    ].join('');
  }

  function shadow() {
    return '<ellipse cx="110" cy="193" rx="55" ry="9" fill="' + INK + '" opacity=".12"/>';
  }

  function cup(theme) {
    const body = [
      '<path d="M64 127 H156 L147 187 Q145.5 195 137 195 H83 Q74.5 195 73 187 Z" fill="#FFFDF8"/>',
      '<path d="M64 127 H156 L147 187 Q145.5 195 137 195 H83 Q74.5 195 73 187 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<path d="M65 128 Q110 138 155 128" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>',
      '<path d="M76 169 H144 L141.5 185 Q140.5 189 137 189 H83 Q79.5 189 78.5 185 Z" fill="' + theme.accent + '" opacity=".94"/>',
      '<circle cx="110" cy="177" r="4.6" fill="#FFF9F1"/>',
      '<path d="M103 183 h14" stroke="#FFF9F1" stroke-width="2.2" stroke-linecap="round"/>',
      '<path d="M83 142 q1 20 6 37" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".75"/>'
    ].join('');
    const scoops = [
      '<circle cx="86" cy="111" r="29" fill="' + theme.secondary + '"/>',
      '<circle cx="145" cy="112" r="23" fill="' + theme.secondary + '"/>',
      '<circle cx="115" cy="92" r="37" fill="' + theme.primary + '"/>',
      '<path d="M88 108 q28 17 61 -4" fill="none" stroke="' + theme.secondary + '" stroke-width="8" stroke-linecap="round" opacity=".4"/>',
      '<path d="M77 93 q9 -12 22 -11" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity=".55"/>',
      '<path d="M97 67 q13 -10 28 -4" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity=".5"/>',
      '<path d="M134 104 q8 -8 16 -4" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity=".55"/>'
    ].join('');
    return frame([
      shadow(),
      body,
      scoops
    ].join(''));
  }

  function taca(theme) {
    const scoops = [
      '<circle cx="88" cy="95" r="26" fill="' + theme.primary + '"/>',
      '<circle cx="140" cy="99" r="20" fill="' + theme.secondary + '"/>',
      '<circle cx="116" cy="83" r="29" fill="' + theme.secondary + '"/>',
      '<path d="M94 86 q20 11 43 -3" fill="none" stroke="' + theme.primary + '" stroke-width="6" stroke-linecap="round" opacity=".35"/>',
      '<path d="M104 70 q10 -7 21 -3" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".55"/>',
      '<path d="M79 84 q7 -9 17 -8" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity=".5"/>'
    ].join('');
    return frame([
      shadow(),
      scoops,
      '<path d="M61 96 H159 C159 145 139 162 110 162 C81 162 61 145 61 96 Z" fill="#FFFFFF" opacity=".38"/>',
      '<path d="M61 96 H159 C159 145 139 162 110 162 C81 162 61 145 61 96 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<path d="M77 111 q2 27 21 38" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".75"/>',
      '<path d="M110 162 V183" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>',
      '<path d="M83 187 Q110 178 137 187" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>',
      '<path d="M61 96 H159" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>'
    ].join(''));
  }

  function conePath(uid, big) {
    if (big) {
      return '<path d="M70 100 H150 L117 190 Q110 203 103 190 Z" fill="#F2C986"/><path d="M70 100 H150 L117 190 Q110 203 103 190 Z" fill="url(#waffle-' + uid + ')" opacity=".72"/><path d="M70 100 H150 L117 190 Q110 203 103 190 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>';
    }
    return '<path d="M79 106 H141 L114 187 Q110 198 106 187 Z" fill="#F2C986"/><path d="M79 106 H141 L114 187 Q110 198 106 187 Z" fill="url(#waffle-' + uid + ')" opacity=".72"/><path d="M79 106 H141 L114 187 Q110 198 106 187 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>';
  }

  function wafflePattern(uid) {
    return '<defs><pattern id="waffle-' + uid + '" width="17" height="17" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0 V17 M0 0 H17" fill="none" stroke="#B97A3D" stroke-width="2.2" opacity=".8"/></pattern></defs>';
  }

  function casquinha(theme) {
    const uid = ++artCounter;
    return frame([
      wafflePattern(uid),
      shadow(),
      conePath(uid, false),
      '<circle cx="110" cy="85" r="32" fill="' + theme.primary + '"/>',
      '<path d="M88 93 q22 12 44 -4" fill="none" stroke="' + theme.secondary + '" stroke-width="7" stroke-linecap="round" opacity=".4"/>',
      '<path d="M96 72 q10 -8 22 -4" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" opacity=".5"/>',
      '<path d="M132 76 q9 3 12 11" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity=".35"/>'
    ].join(''));
  }

  function cascao(theme) {
    const uid = ++artCounter;
    return frame([
      wafflePattern(uid),
      shadow(),
      conePath(uid, true),
      '<circle cx="89" cy="91" r="29" fill="' + theme.secondary + '"/>',
      '<circle cx="130" cy="83" r="31" fill="' + theme.primary + '"/>',
      '<path d="M106 92 q23 12 46 -5" fill="none" stroke="' + theme.secondary + '" stroke-width="7" stroke-linecap="round" opacity=".4"/>',
      '<path d="M115 68 q10 -8 22 -4" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" opacity=".5"/>',
      '<path d="M77 82 q7 -9 17 -8" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" opacity=".55"/>'
    ].join(''));
  }

  function milkshake(theme) {
    return frame([
      '<path d="M138 41 L119 92" fill="none" stroke="' + theme.accent + '" stroke-width="13" stroke-linecap="round"/>',
      '<path d="M136 46 L123 85" fill="none" stroke="#FFF9F1" stroke-width="3.4" stroke-linecap="round" opacity=".6"/>',
      shadow(),
      '<path d="M84 114 H136 L130 188 Q129 193 123 193 H97 Q91 193 90 188 Z" fill="' + theme.primary + '"/>',
      '<path d="M82 111 q-2 -20 17 -22 q7 -15 24 -12 q15 -2 20 12 q16 4 13 22 q-37 13 -74 0 Z" fill="' + theme.secondary + '"/>',
      '<path d="M96 93 q14 10 31 1 q13 -5 22 1" fill="none" stroke="' + theme.primary + '" stroke-width="6" stroke-linecap="round" opacity=".4"/>',
      '<path d="M68 117 H152 L143 188 Q141 196 132 196 H88 Q79 196 77 188 Z" fill="#FFFFFF" opacity=".3"/>',
      '<path d="M68 117 H152 L143 188 Q141 196 132 196 H88 Q79 196 77 188 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<ellipse cx="110" cy="117" rx="42" ry="7" fill="#FFFFFF" opacity=".65"/>',
      '<path d="M79 171 H141 L138 187 Q137 191 132 191 H88 Q83 191 82 187 Z" fill="' + theme.accent + '" opacity=".94"/>',
      '<circle cx="110" cy="181" r="4.2" fill="#FFF9F1"/>',
      '<path d="M104 186 h12" stroke="#FFF9F1" stroke-width="2.2" stroke-linecap="round"/>',
      '<path d="M82 130 q1 16 5 27" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".65"/>'
    ].join(''));
  }

  function water(theme, sparkling) {
    const bubbles = sparkling
      ? '<circle cx="98" cy="151" r="3" fill="#FFFFFF" opacity=".85"/><circle cx="119" cy="137" r="2.4" fill="#FFFFFF" opacity=".75"/><circle cx="107" cy="126" r="2" fill="#FFFFFF" opacity=".8"/><circle cx="127" cy="158" r="2.7" fill="#FFFFFF" opacity=".7"/>'
      : '<circle cx="112" cy="142" r="2.4" fill="#FFFFFF" opacity=".7"/>';
    return frame([
      shadow(),
      '<path d="M91 58 H129 V77 C143 85 149 98 149 113 V177 Q149 190 136 190 H84 Q71 190 71 177 V113 C71 98 77 85 91 77 Z" fill="' + theme.secondary + '"/>',
      '<path d="M91 58 H129 V77 C143 85 149 98 149 113 V177 Q149 190 136 190 H84 Q71 190 71 177 V113 C71 98 77 85 91 77 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<rect x="94" y="42" width="32" height="18" rx="4" fill="' + theme.primary + '" stroke="' + INK + '" stroke-width="3"/>',
      '<path d="M77 153 H143 V174 Q143 182 134 182 H86 Q77 182 77 174 Z" fill="#FFFFFF" opacity=".78"/>',
      '<path d="M88 160 q22 -9 44 0" fill="none" stroke="' + theme.primary + '" stroke-width="3" stroke-linecap="round" opacity=".75"/>',
      '<path d="M83 92 q-4 22 -1 47" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
      bubbles
    ].join(''));
  }

  function colaCan(theme) {
    return frame([
      shadow(),
      '<path d="M76 62 Q76 55 85 55 H135 Q144 55 144 62 V172 Q144 184 132 184 H88 Q76 184 76 172 Z" fill="' + theme.primary + '"/>',
      '<ellipse cx="110" cy="62" rx="34" ry="8" fill="#D9DEE1" stroke="' + INK + '" stroke-width="3"/>',
      '<ellipse cx="110" cy="61" rx="21" ry="4.5" fill="none" stroke="#8D999E" stroke-width="2"/>',
      '<path d="M100 58 q6 -4 12 0" fill="none" stroke="#7B898F" stroke-width="2.4" stroke-linecap="round"/>',
      '<path d="M77 112 q17 -15 34 0 t33 0" fill="none" stroke="#FFF7F3" stroke-width="12" stroke-linecap="round"/>',
      '<path d="M78 129 q16 -10 32 1 t32 -1" fill="none" stroke="#FFF7F3" stroke-width="4" stroke-linecap="round" opacity=".85"/>',
      '<path d="M84 78 q-2 38 0 80" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".25"/>',
      '<path d="M76 62 Q76 55 85 55 H135 Q144 55 144 62 V172 Q144 184 132 184 H88 Q76 184 76 172 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>'
    ].join(''));
  }

  function colaBottle(theme) {
    return frame([
      shadow(),
      '<path d="M101 68 H119 V83 C132 91 138 104 138 120 V170 Q138 184 124 184 H96 Q82 184 82 170 V120 C82 104 88 91 101 83 Z" fill="' + theme.secondary + '"/>',
      '<path d="M101 68 H119 V83 C132 91 138 104 138 120 V170 Q138 184 124 184 H96 Q82 184 82 170 V120 C82 104 88 91 101 83 Z" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<rect x="100" y="46" width="20" height="24" rx="4" fill="' + theme.primary + '" stroke="' + INK + '" stroke-width="3"/>',
      '<path d="M95 49 h30" stroke="#FFFFFF" stroke-width="2.4" opacity=".45"/>',
      '<path d="M82 120 H138 V162 H82 Z" fill="' + theme.primary + '"/>',
      '<path d="M83 137 q13 -11 27 0 t27 0" fill="none" stroke="#FFF7F3" stroke-width="6" stroke-linecap="round"/>',
      '<path d="M87 89 q-3 34 0 73" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".25"/>',
      '<path d="M92 166 q18 6 36 0" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity=".25"/>'
    ].join(''));
  }

  function banana(theme) {
    return frame([
      shadow(),
      '<path d="M71 139 C84 178 151 177 160 109 C152 135 121 153 97 132 C86 122 76 127 71 139 Z" fill="' + theme.primary + '" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>',
      '<path d="M79 144 C94 164 132 165 149 135" fill="none" stroke="' + theme.secondary + '" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
      '<path d="M152 118 q10 -8 12 -17" fill="none" stroke="' + theme.accent + '" stroke-width="5" stroke-linecap="round"/>',
      '<path d="M72 138 q-4 6 -2 12" fill="none" stroke="' + theme.accent + '" stroke-width="5" stroke-linecap="round"/>',
      '<path d="M96 137 C111 150 132 147 144 131" fill="none" stroke="' + theme.accent + '" stroke-width="2" stroke-linecap="round" opacity=".35"/>',
      '<circle cx="105" cy="142" r="2" fill="' + theme.accent + '" opacity=".35"/>',
      '<circle cx="120" cy="144" r="1.6" fill="' + theme.accent + '" opacity=".3"/>'
    ].join(''));
  }

  function render(product, flavorId) {
    if (!product) {
      return '';
    }
    const theme = getTheme(product, flavorId);
    switch (product.art) {
      case 'cup':
        return cup(theme);
      case 'taca':
        return taca(theme);
      case 'casquinha':
        return casquinha(theme);
      case 'cascao':
        return cascao(theme);
      case 'milkshake':
        return milkshake(theme);
      case 'water':
        return water(theme, false);
      case 'sparkling':
        return water(theme, true);
      case 'cola-can':
        return colaCan(theme);
      case 'cola-bottle':
        return colaBottle(theme);
      case 'banana':
        return banana(theme);
      default:
        return cup(theme);
    }
  }

  function getProductArt(product, flavorId, imageClass) {
    if (!product) {
      return '';
    }
    if (product.image) {
      const alt = product.imageAlt || product.fullName || product.name || '';
      return '<img class="' + (imageClass || 'product-art') + '" src="' + product.image + '" alt="' + alt + '" loading="lazy" decoding="async">';
    }
    return render(product, flavorId);
  }

  B.art = {
    getTheme: getTheme,
    getFlavorSwatch: getFlavorSwatch,
    render: render,
    getProductArt: getProductArt
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
