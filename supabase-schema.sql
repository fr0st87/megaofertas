-- ============================================
-- SCRIPT SQL PARA CONFIGURAR SUPABASE
-- MegaOfertas - Tienda Segura
-- ============================================

-- 1. CREAR TABLAS
-- ============================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id TEXT REFERENCES categories(id),
  img TEXT,
  img_file_name TEXT,
  description TEXT DEFAULT '',
  featured BOOLEAN DEFAULT FALSE,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pedidos (para futuro uso con Edge Functions)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES PARA MEJORAR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 3. ROW LEVEL SECURITY (RLS) - CRÍTICO PARA SEGURIDAD
-- ============================================

-- Activar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURIDAD:

-- Categorías: TODOS pueden leer, solo admin autenticado puede escribir
CREATE POLICY "Cualquiera puede ver categorías" 
  ON categories FOR SELECT 
  USING (true);

CREATE POLICY "Solo admin autenticado puede modificar categorías" 
  ON categories FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Productos: TODOS pueden leer, solo admin autenticado puede escribir
CREATE POLICY "Cualquiera puede ver productos" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Solo admin autenticado puede modificar productos" 
  ON products FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Pedidos: Solo admin puede ver, cualquier usuario puede crear
CREATE POLICY "Solo admin puede ver pedidos" 
  ON orders FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cualquiera puede crear pedidos" 
  ON orders FOR INSERT 
  WITH CHECK (true);

-- 4. TRIGGERS PARA ACTUALIZAR FECHAS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para categorías
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para productos
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar categorías por defecto
INSERT INTO categories (id, name) VALUES
  ('cat-tv-001', 'TV y video'),
  ('cat-lav-001', 'Lavado'),
  ('cat-ref-001', 'Refrigeración'),
  ('cat-coc-001', 'Cocina'),
  ('cat-cli-001', 'Climatización')
ON CONFLICT (id) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (id, code, name, price, currency, category_id, img, description, featured, stock) VALUES
  ('prod-001', 'CP-REF-001', 'Smart TV 50''''', 499, 'USD', 'cat-tv-001', 'https://placehold.co/480x320/141414/dc2626?text=TV+50', 'Panel 4K UHD, HDR y smart TV integrado. Ideal para salón.', true, null),
  ('prod-002', 'CP-NEV-001', 'Refrigerador no frost', 789, 'USD', 'cat-ref-001', 'https://placehold.co/480x320/141414/dc2626?text=Nevera', 'No frost, dispensador y gran capacidad familiar.', false, null),
  ('prod-003', 'CP-LAV-001', 'Lavadora 9 kg', 329, 'USD', 'cat-lav-001', 'https://placehold.co/480x320/141414/dc2626?text=Lavadora', 'Carga frontal, ahorro energético y múltiples programas.', false, 12),
  ('prod-004', 'CP-MIC-001', 'Microondas digital', 89, 'USD', 'cat-coc-001', 'https://placehold.co/480x320/141414/dc2626?text=Microondas', '25 L, grill, programas automáticos y panel táctil.', false, 20),
  ('prod-005', 'CP-CLI-001', 'Aire split 3500 frigorías', 459, 'USD', 'cat-cli-001', 'https://placehold.co/480x320/141414/dc2626?text=Aire+A/C', 'Frío/calor, eficiencia A, kit de instalación básico.', false, 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSTRUCCIONES POST-INSTALACIÓN:
-- ============================================
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Ir a Authentication > Users y crear usuario admin
-- 3. Configurar email y contraseña en admin-auth.js
-- 4. Probar login en /admin.html
-- ============================================
