# 🔒 Guía de Seguridad - MegaOfertas con Supabase

## ✅ Cambios Implementados

### 1. **Autenticación Segura con Supabase Auth**
- Login contra servidor (no solo hash local)
- Tokens JWT con expiración
- Sesiones persistentes seguras
- Rate limiting real en Supabase

### 2. **Base de Datos en la Nube**
- Catálogo almacenado en Supabase PostgreSQL
- Los clientes NO pueden modificar precios/stock desde el navegador
- Row Level Security (RLS) activado

### 3. **Headers de Seguridad**
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection

### 4. **Cache Local Temporal**
- Solo para performance (5 minutos TTL)
- Siempre se valida contra servidor
- Fallback offline seguro

---

## 📋 Pasos para Configurar Supabase

### Paso 1: Ejecutar Script SQL
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `hkgdbealspivhkmvtqcv`
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `supabase-schema.sql`
5. Ejecuta el script

### Paso 2: Crear Usuario Admin
1. En Supabase Dashboard, ve a **Authentication > Users**
2. Click en **Add user**
3. Ingresa email y contraseña segura
4. Guarda las credenciales

### Paso 3: Configurar Credenciales en el Código
Edita `admin-auth.js`:
```javascript
window.ELECTROSTORE_ADMIN_PASSWORD_SHA256 = 'TU_HASH_AQUI';
window.SUPABASE_ADMIN_EMAIL = 'tu-email@dominio.com';
```

Para generar el hash SHA-256:
- Abre `tools/generar-hash.html` en tu navegador
- Ingresa tu contraseña
- Copia el hash generado

### Paso 4: Verificar RLS
En Supabase Dashboard:
1. Ve a **Authentication > Policies**
2. Verifica que las tablas tengan RLS activado
3. Confirma las políticas de lectura/escritura

---

## 🚀 Despliegue en GitHub Pages

### Antes de Desplegar:
```bash
# Verifica que todos los archivos estén commiteados
git add .
git commit -m "Seguridad: integración con Supabase"
git push origin main
```

### En GitHub:
1. Ve a Settings > Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save

### URL de producción:
`https://TU_USUARIO.github.io/TU_REPO/`

---

## ⚠️ Consideraciones de Seguridad

### Lo que SÍ está protegido:
✅ Autenticación contra servidor  
✅ Precios y stock no manipulables  
✅ Sesiones con tokens JWT  
✅ Políticas RLS en base de datos  
✅ Headers de seguridad HTTP  

### Lo que DEBES hacer adicionalmente:
🔲 Usar HTTPS (GitHub Pages lo incluye)  
🔲 No exponer claves secretas en el repo  
🔲 Actualizar contraseñas regularmente  
🔲 Monitorear logs de Supabase  
🔲 Hacer backup de la base de datos  

### Limitaciones de GitHub Pages:
⚠️ Todo el código frontend es público  
⚠️ No hay backend propio (usamos Supabase)  
⚠️ Los pagos deben procesarse externamente  

---

## 🛡️ Mejoras Futuras Recomendadas

1. **Edge Functions para Pedidos**
   - Validar totales en servidor
   - Prevenir manipulación de precios

2. **Integración con Pasarela de Pago**
   - Stripe o PayPal
   - Nunca procesar tarjetas en frontend

3. **Monitoreo y Logs**
   - Supabase Logs
   - Alertas de actividad sospechosa

4. **Backup Automático**
   - Exportar DB periódicamente
   - Versionar datos críticos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica logs en Supabase Dashboard
3. Confirma que RLS esté activo
4. Prueba en modo incógnito

---

**Fecha de actualización:** Enero 2025  
**Versión:** 2.0.0 (con Supabase)
