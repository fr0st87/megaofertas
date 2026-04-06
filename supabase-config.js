/**
 * Configuración de Supabase para MegaOfertas
 * 
 * IMPORTANTE: Estas claves SON PÚBLICAS y seguras para usar en el frontend
 * siempre que tengas Row Level Security (RLS) activado en tus tablas.
 */

window.SUPABASE_CONFIG = {
  url: 'https://hkgdbealspivhkmvtqcv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ2RiZWFsc3BpdmhrbXZ0cWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzg4NTYsImV4cCI6MjA5MDk1NDg1Nn0.nd_JyTHflGDTPkluZ-J4Al9zvD30zkRN_Xy4SUrTMUw'
};

// Inicializar cliente de Supabase (se cargará desde CDN)
window.addEventListener('DOMContentLoaded', () => {
  if (typeof supabase !== 'undefined') {
    window.sbClient = supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase inicializado correctamente');
  } else {
    console.warn('⚠️ Cliente de Supabase no disponible. Verifica que el script se cargó.');
  }
});
