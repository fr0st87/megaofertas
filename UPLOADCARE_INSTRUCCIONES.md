# Subida de Imágenes con Uploadcare

## ¿Qué es Uploadcare?
Uploadcare es un servicio **gratuito** que permite subir y alojar imágenes sin necesidad de registro ni tarjeta de crédito. Es accesible desde Cuba y ofrece:

- ✅ 3000 archivos gratis (hasta 5MB cada uno)
- ✅ CDN global para carga rápida
- ✅ Optimización automática de imágenes
- ✅ Sin restricciones geográficas
- ✅ No requiere registro para usar el widget básico

## Cómo usarlo en el panel de administración

### Opción 1: Subir con el botón (Recomendado)
1. En el panel de administración, hacé clic en **"📷 Abrir uploader de Uploadcare"**
2. Seleccioná la imagen desde tu computadora, Facebook, Dropbox o cámara
3. Esperá a que se complete la subida (verás el progreso)
4. La URL de la imagen se copiará automáticamente al campo "Ruta o URL de imagen"
5. Guardá el producto normalmente

### Opción 2: Pegar URL manualmente
1. Si ya tenés una imagen subida a Uploadcare, copiá la URL (ej: `https://ucarecdn.com/abc123-foto.jpg`)
2. Pegala directamente en el campo "Ruta o URL de imagen"
3. Guardá el producto

## Ventajas sobre el método anterior

| Método anterior | Método Uploadcare |
|----------------|-------------------|
| Imágenes en localStorage (límite ~5MB total) | Imágenes en la nube (3000 archivos gratis) |
| Ocupa espacio del navegador | No ocupa espacio local |
| Solo accesible desde tu computadora | Accesible desde cualquier dispositivo |
| Sin optimización | Optimización automática |
| Sin CDN | CDN global incluido |

## Notas importantes

- Las imágenes subidas a Uploadcare son **públicas** (cualquiera con la URL puede verlas)
- El plan gratuito permite hasta **3000 archivos** y **3GB** de tráfico mensual
- Las URLs de Uploadcare son permanentes mientras el servicio exista
- Para uso profesional, considerá crear una cuenta gratuita en uploadcare.com para tener más control

## Ejemplo de URL de Uploadcare
```
https://ucarecdn.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890/mi-producto.jpg
```

Esta URL es la que se guarda en el producto y se muestra en la tienda.
