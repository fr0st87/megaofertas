/**
 * Catálogo y carrito.
 * 
 * Usa Supabase como almacenamiento principal para el catálogo.
 * El carrito sigue en localStorage del navegador.
 */

// Clave para localStorage (carrito)
const CART_KEY = 'electrostore_cart';

// Tablas de Supabase
const SUPABASE_TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories'
};

/**
 * Obtener cliente de Supabase configurado
 */
function getSupabaseClient() {
  if (!window.supabase) {
    console.warn('Supabase no está cargado.');
    return null;
  }
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.url || !config.anonKey) {
    console.warn('Supabase no está configurado correctamente.');
    return null;
  }
  return window.supabase.createClient(config.url, config.anonKey);
}

/**
 * Verificar si Supabase está disponible y configurado
 */
function isSupabaseAvailable() {
  const client = getSupabaseClient();
  return client !== null;
}

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
        code: 'CP-REF-001',
        name: "Smart TV 50''",
        price: 499,
        currency: 'USD',
        categoryId: catTv,
        img: phImg('TV 50" 4K'),
        description: 'Panel 4K UHD, HDR y smart TV integrado. Ideal para salón.',
        featured: true,
        stock: null
      },
      {
        id: uid(),
        code: 'CP-NEV-001',
        name: 'Refrigerador no frost',
        price: 789,
        currency: 'USD',
        categoryId: catRef,
        img: phImg('Nevera'),
        description: 'No frost, dispensador y gran capacidad familiar.',
        featured: false,
        stock: null
      },
      {
        id: uid(),
        code: 'CP-LAV-001',
        name: 'Lavadora 9 kg',
        price: 329,
        currency: 'USD',
        categoryId: catLav,
        img: phImg('Lavadora'),
        description: 'Carga frontal, ahorro energético y múltiples programas.',
        featured: false,
        stock: 12
      },
      {
        id: uid(),
        code: 'CP-MIC-001',
        name: 'Microondas digital',
        price: 89,
        currency: 'USD',
        categoryId: catCoc,
        img: phImg('Microondas'),
        description: '25 L, grill, programas automáticos y panel táctil.',
        featured: false,
        stock: 20
      },
      {
        id: uid(),
        code: 'CP-CLI-001',
        name: 'Aire split 3500 frigorías',
        price: 459,
        currency: 'USD',
        categoryId: catCli,
        img: phImg('Aire A/C'),
        description: 'Frío/calor, eficiencia A, kit de instalación básico.',
        featured: false,
        stock: 8
      }
    ]
  };
}

/**
 * Migración de datos para mantener compatibilidad
 */
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
    if (typeof p.currency !== 'string' || !['USD', 'CUP'].includes(p.currency)) {
      p.currency = 'USD';
      changed = true;
    }
    if (typeof p.code !== 'string') {
      p.code = '';
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
  return data;
}

/**
 * Cargar catálogo desde Supabase
 * Si falla, intenta cargar desde localStorage como fallback
 */
async function loadCatalog() {
  // Intentar cargar desde sessionStorage primero (más rápido y confiable)
  try {
    const raw = sessionStorage.getItem('electrostore_catalog');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.categories && data.products) {
        console.log('Catálogo cargado desde sessionStorage:', data.categories.length, 'categorías');
        return migrateCatalog(data);
      }
    }
  } catch (e) {
    console.warn('No se pudo leer el catálogo de sessionStorage', e);
  }
  
  // Si no hay nada en sessionStorage, intentar Supabase
  if (isSupabaseAvailable()) {
    try {
      const supabase = getSupabaseClient();
      
      // Cargar categorías
      const { data: categories, error: catError } = await supabase
        .from(SUPABASE_TABLES.CATEGORIES)
        .select('*')
        .order('name');
      
      // Cargar productos
      const { data: products, error: prodError } = await supabase
        .from(SUPABASE_TABLES.PRODUCTS)
        .select('*')
        .order('name');
      
      if (!catError && !prodError) {
        const catalog = {
          categories: categories || [],
          products: products || []
        };
        
        // Si está vacío, crear datos por defecto
        if (catalog.categories.length === 0 && catalog.products.length === 0) {
          const defaultCatalog = getDefaultCatalog();
          await saveCatalog(defaultCatalog);
          return defaultCatalog;
        }
        
        console.log('Catálogo cargado desde Supabase:', catalog.categories.length, 'categorías');
        return migrateCatalog(catalog);
      }
      
      console.warn('Error cargando desde Supabase:', catError || prodError);
    } catch (e) {
      console.warn('Error conectando a Supabase:', e);
    }
  }
  
  // Crear datos por defecto si no hay nada
  console.log('Creando catálogo por defecto');
  const def = getDefaultCatalog();
  saveCatalog(def);
  return def;
}

/**
 * Guardar catálogo en Supabase
 * También guarda en sessionStorage como caché local
 */
async function saveCatalog(data) {
  // Siempre guardar en sessionStorage como caché principal
  try {
    sessionStorage.setItem('electrostore_catalog', JSON.stringify(data));
    console.log('Catálogo guardado en sessionStorage');
  } catch (e) {
    console.error('Error guardando en sessionStorage:', e);
  }
  
  // Guardar en Supabase si está disponible (solo como backup)
  if (isSupabaseAvailable()) {
    try {
      const supabase = getSupabaseClient();
      
      // Actualizar categorías (upsert)
      if (data.categories && data.categories.length > 0) {
        // Primero limpiar tabla
        await supabase.from(SUPABASE_TABLES.CATEGORIES).delete().neq('id', '');
        // Insertar nuevas
        await supabase.from(SUPABASE_TABLES.CATEGORIES).insert(data.categories);
      }
      
      // Actualizar productos (upsert)
      if (data.products && data.products.length > 0) {
        // Primero limpiar tabla
        await supabase.from(SUPABASE_TABLES.PRODUCTS).delete().neq('id', '');
        // Insertar nuevos
        await supabase.from(SUPABASE_TABLES.PRODUCTS).insert(data.products);
      }
      
      console.log('Catálogo guardado en Supabase');
    } catch (e) {
      console.error('Error guardando en Supabase:', e);
      console.warn('Se usará el catálogo local de sessionStorage');
    }
  }
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
