/**
 * Catálogo, carrito y favoritos en localStorage (tienda + admin).
 */
const STORE_KEY = 'electrostore_catalog';
const CART_KEY = 'electrostore_cart';
const WISHLIST_KEY = 'electrostore_wishlist';

function getSiteRoot() {
  if (typeof window === 'undefined') return '';
  let r = '';
  if (typeof window.MEGAOFERTAS_SITE_ROOT === 'string' && window.MEGAOFERTAS_SITE_ROOT !== '') {
    r = window.MEGAOFERTAS_SITE_ROOT;
  } else if (
    typeof window.ELECTROSTORE_SITE_ROOT === 'string' &&
    window.ELECTROSTORE_SITE_ROOT !== ''
  ) {
    r = window.ELECTROSTORE_SITE_ROOT;
  }
  return r.replace(/\/$/, '');
}

function resolveAssetUrl(url) {
  if (url == null || url === '') return url;
  const u = String(url).trim();
  if (/^(https?:|data:)/i.test(u)) return u;
  if (u.startsWith('/')) {
    const root = getSiteRoot();
    return root ? root + u : u;
  }
  return u;
}

function uid() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function phImg(label) {
  return (
    'https://placehold.co/480x320/141414/dc2626?text=' + encodeURIComponent(label)
  );
}

function getDefaultCatalog() {
  const catTv = uid();
  const catLav = uid();
  const catRef = uid();
  const catCoc = uid();
  const catCli = uid();
  return {
    categories: [
      { id: catTv, name: 'TV y video' },
      { id: catLav, name: 'Lavado' },
      { id: catRef, name: 'Refrigeración' },
      { id: catCoc, name: 'Cocina' },
      { id: catCli, name: 'Climatización' }
    ],
    products: [
      {
        id: uid(),
        name: "Smart TV 50''",
        price: 499,
        categoryId: catTv,
        img: phImg('TV 50" 4K'),
        description: 'Panel 4K UHD, HDR y smart TV integrado. Ideal para salón.',
        featured: true,
        stock: null
      },
      {
        id: uid(),
        name: 'Lavadora 9 kg',
        price: 329,
        categoryId: catLav,
        img: phImg('Lavadora'),
        description: 'Carga frontal, ahorro energético y múltiples programas.',
        featured: false,
        stock: 12
      },
      {
        id: uid(),
        name: 'Refrigerador no frost',
        price: 789,
        categoryId: catRef,
        img: phImg('Nevera'),
        description: 'No frost, dispensador y gran capacidad familiar.',
        featured: false,
        stock: null
      },
      {
        id: uid(),
        name: 'Microondas digital',
        price: 89,
        categoryId: catCoc,
        img: phImg('Microondas'),
        description: '25 L, grill, programas automáticos y panel táctil.',
        featured: false,
        stock: 20
      },
      {
        id: uid(),
        name: 'Aire split 3500 frigorías',
        price: 459,
        categoryId: catCli,
        img: phImg('Aire A/C'),
        description: 'Frío/calor, eficiencia A, kit de instalación básico.',
        featured: false,
        stock: 8
      }
    ]
  };
}

function migrateCatalog(data) {
  let changed = false;
  for (const p of data.products) {
    if (typeof p.description !== 'string') {
      p.description = '';
      changed = true;
    }
    if (typeof p.featured !== 'boolean') {
      p.featured = false;
      changed = true;
    }
    if (p.stock !== null && p.stock !== undefined && typeof p.stock !== 'number') {
      p.stock = null;
      changed = true;
    }
    if (p.stock === undefined) {
      p.stock = null;
      changed = true;
    }
  }
  if (changed) saveCatalog(data);
  return data;
}

function loadCatalog() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.categories && data.products) return migrateCatalog(data);
    }
  } catch (e) {
    console.warn('No se pudo leer el catálogo', e);
  }
  const def = getDefaultCatalog();
  saveCatalog(def);
  return def;
}

function saveCatalog(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

/** Líneas del carrito: { productId, qty } */
function loadCartLines() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.productId === 'string' && Number(x.qty) > 0)
      .map((x) => ({ productId: x.productId, qty: Math.floor(Number(x.qty)) }));
  } catch {
    return [];
  }
}

function saveCartLines(lines) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
}

function loadWishlistIds() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveWishlistIds(ids) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

function toggleWishlistId(productId) {
  let ids = loadWishlistIds();
  if (ids.includes(productId)) ids = ids.filter((id) => id !== productId);
  else ids.push(productId);
  saveWishlistIds(ids);
  return ids.includes(productId);
}

function isInWishlist(productId) {
  return loadWishlistIds().includes(productId);
}
