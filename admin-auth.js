/**
 * Contraseña del panel: solo se guarda el SHA-256 en hexadecimal (64 caracteres).
 * No pongas la contraseña en texto plano aquí.
 *
 * Generala con tools/generar-hash.html (o cualquier herramienta SHA-256)
 * y pega el resultado entre comillas.
 *
 * EN PRODUCCIÓN CON SUPABASE:
 * - La autenticación real se hace contra Supabase Auth
 * - Este hash es SOLO como fallback/backup si falla la conexión a Supabase
 * - Configura usuarios en el dashboard de Supabase > Authentication > Users
 * - El sistema intentará primero login con Supabase, si falla usará este hash local
 */
window.ELECTROSTORE_ADMIN_PASSWORD_SHA256 = ''; // DEJAR VACÍO - Usando Supabase Auth

// Configuración de Supabase Auth para admin
// IMPORTANTE: Poné aquí el email EXACTO que creaste en Supabase > Authentication > Users
window.SUPABASE_ADMIN_EMAIL = 'skynet871012@gmail.com'; // ← Email configurado
