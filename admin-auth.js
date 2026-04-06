/**
 * Contraseña del panel: solo se guarda el SHA-256 en hexadecimal (64 caracteres).
 * No pongas la contraseña en texto plano aquí.
 *
 * Generala con tools/generar-hash.html (o cualquier herramienta SHA-256)
 * y pega el resultado entre comillas.
 *
 * EN PRODUCCIÓN CON SUPABASE:
 * - La autenticación real se hace contra Supabase Auth
 * - Este hash es solo como fallback/backup
 * - Configura usuarios en el dashboard de Supabase
 */
window.ELECTROSTORE_ADMIN_PASSWORD_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // Hash de ejemplo - CAMBIAR

// Configuración de Supabase Auth para admin
window.SUPABASE_ADMIN_EMAIL = 'admin@megaofertas.local'; // Cambiar por email real en Supabase
