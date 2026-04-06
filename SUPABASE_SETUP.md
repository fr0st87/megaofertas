# Configuración de Supabase para MegaOfertas

## ✅ Configuración Actualizada

Tu proyecto ya está configurado con las siguientes credenciales:
- **URL**: `https://hkgdbealspivhkmvtqcv.supabase.co`
- **Anon Key**: Configurada en `supabase-config.js`

## Pasos para completar la configuración

### 1. Crear tablas en Supabase (CRÍTICO)

Ve al **SQL Editor** en Supabase y ejecuta el siguiente script:

```sql
-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id TEXT REFERENCES categories(id),
  img TEXT,
  img_file_name TEXT,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public write access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public write access to products" ON products;

-- Políticas para permitir acceso público de lectura
-- IMPORTANTE: Solo usuarios autenticados pueden escribir

CREATE POLICY "Allow public read access to categories" 
  ON categories FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to write categories" 
  ON categories FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to products" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to write products" 
  ON products FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
```

### 2. Configurar usuario administrador

1. Ve a **Authentication** → **Users** en Supabase
2. Haz clic en **Add user**
3. Ingresa:
   - **Email**: `skynet871012@gmail.com`
   - **Contraseña**: (la contraseña que quieras usar)
4. **IMPORTANTE**: Desmarca la opción "Confirm email" para que puedas acceder inmediatamente sin necesidad de confirmar el correo
5. Haz clic en **Create user**

### 3. Verificar la configuración

1. Abre `admin.html` en tu navegador
2. Deberías ver el formulario de login con:
   - Campo para correo electrónico
   - Campo para contraseña
3. Ingresa:
   - **Email**: `skynet871012@gmail.com`
   - **Contraseña**: La que estableciste en el paso anterior
4. Si todo está correcto, accederás al panel de administración

---

## 🔒 Seguridad y Fugas de Información

### ¿Es segura la clave anon?

**SÍ**, la clave `anon` es pública por diseño. Así funciona Supabase:

1. **Clave Anon (pública)**: Se usa en el frontend (navegador). Cualquiera puede verla.
2. **Clave Service Role (secreta)**: Nunca se comparte, solo se usa en backend.

### ¿Cómo protege Supabase mis datos?

La seguridad NO está en ocultar la clave, sino en las **Políticas de Row Level Security (RLS)**:

#### Configuración actual (segura):
- ✅ **Lectura pública**: Cualquiera puede ver productos y categorías
- ✅ **Escritura protegida**: Solo usuarios autenticados pueden crear/editar/eliminar
- ✅ **RLS activado**: Las políticas se aplican incluso con la clave anon

#### ¿Qué pasa si alguien roba la clave anon?

NADA MALO. Con esa clave solo pueden:
- Leer productos y categorías (que es público de todos modos)
- NO pueden borrar tablas
- NO pueden cambiar configuraciones del proyecto
- NO pueden acceder a otras tablas sin políticas adecuadas

### Recomendaciones adicionales de seguridad

1. **Nunca compartas la clave `service_role`**: Esta sí da acceso total.
2. **Revisa las políticas RLS regularmente**: Asegúrate de que solo los autenticados puedan escribir.
3. **Habilita confirmación de email en producción**: Para mayor seguridad, exige que los admins confirmen su correo.
4. **Monitorea los logs de autenticación**: En Supabase → Authentication → Logs.

---

## 📋 Verificación de archivos

Los siguientes archivos están configurados correctamente:

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `supabase-config.js` | ✅ Configurado | Contiene URL y clave anon |
| `supabase-auth.js` | ✅ Listo | Maneja login con Supabase |
| `store.js` | ✅ Listo | Guarda/carga desde Supabase |
| `admin.html` | ✅ Listo | Incluye scripts necesarios |
| `admin-auth.js` | ❌ Eliminado | Ya no se usa (sistema local obsoleto) |
| `admin-login.js` | ❌ Eliminado | Ya no se usa (sistema local obsoleto) |

---

## 🐛 Solución de problemas

### Error: "Supabase no está configurado correctamente"
- ✅ Verificado: `supabase-config.js` tiene los valores correctos
- Verifica que no haya errores de sintaxis en el archivo

### Error: "Invalid login credentials"
- Verifica que el usuario `skynet871012@gmail.com` exista en Supabase
- Asegúrate de haber desmarcado "Confirm email" al crearlo
- Verifica que la contraseña sea correcta

### Error: "permission denied for table" o "relation does not exist"
- Ejecuta el script SQL de arriba en el SQL Editor de Supabase
- Verifica que las tablas `categories` y `products` existan

### Error: "Too many requests"
- Supabase limita los intentos de login fallidos
- Espera 1-2 minutos y vuelve a intentar

### Los datos no se guardan
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que las tablas existen en Supabase (Table Editor)
4. Revisa que las políticas RLS estén configuradas

---

## 📞 Soporte

Si tienes problemas después de seguir estos pasos:

1. Revisa la consola del navegador (F12) para ver errores específicos
2. Verifica en Supabase que:
   - Las tablas existen
   - Las políticas RLS están activas
   - El usuario existe y está activo
3. Intenta hacer logout y login nuevamente
