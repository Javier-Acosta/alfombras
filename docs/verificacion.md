# Verificación

## Entorno descartable

Las pruebas usan exclusivamente PocketBase en `127.0.0.1:8097` y Next.js en `localhost:3217`. No leen `.env.local` ni modifican los proyectos de referencia. La base, credenciales aleatorias y fixtures se guardan en `.test-runtime`, excluido de Git.

En Windows, colocar PocketBase 0.40.4 en `.test-runtime/pocketbase.exe` y ejecutar desde la raíz:

```powershell
./.test-runtime/pocketbase.exe serve --http=127.0.0.1:8097 --dir=.test-runtime/pb_data --migrationsDir=pocketbase/pb_migrations
```

En otra terminal:

```powershell
node scripts/prepare-test.mjs
node scripts/test-app.mjs
```

El preparador crea un superusuario y un administrador temporales, imágenes sintéticas y registros de prueba. Es idempotente mientras existan los fixtures. Nunca usar ese número de WhatsApp ni esas fotografías para vender.

Ejecutar:

```powershell
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

Si ya existe un Chromium compatible instalado, se puede indicar su ruta con `PLAYWRIGHT_EXECUTABLE_PATH` sin descargar otro. Las pruebas guardan capturas y trazas en `test-results`, excluido de Git. No abren enlaces de WhatsApp ni envían mensajes.

Para comparar las referencias, iniciar sus compilaciones existentes en los puertos 3218 (Feria del Libro) y 3219 (Tienda Cata) y ejecutar `node scripts/capture-references.mjs`. Solo navega páginas públicas y guarda capturas locales; no modifica sus datos.

## Cobertura comprobada

- Cálculo con precios del servidor, cantidades inválidas, ausencia de productos y snapshots inmutables.
- Sanitización de scripts, atributos ejecutables y URLs peligrosas.
- Portada, noticias, detalle, páginas institucionales y enlace de colección a tienda.
- CSS de tienda presente y estilos institucionales conservados al volver al inicio.
- Fotografía ampliada, Escape y devolución de foco; carrito persistente y almacenamiento inválido.
- Fallo temporal de envío conservando carrito, precio cambiado y segunda confirmación.
- Pedido guardado antes de WhatsApp, resumen privado y reintentos concurrentes sin duplicación.
- Login, logout, acceso directo no autenticado y origen no permitido.
- Guardar borrador, publicar, ordenar y duplicar noticias con imagen.
- Catálogo vacío y catálogo inaccesible diferenciados; archivos falsos o sobredimensionados rechazados sin reemplazar la imagen.
- Cambios de configuración visibles al público y rechazo de un WhatsApp inválido.
- Borradores, pedidos y alta de personal inaccesibles públicamente.

La validación no incluye cobros, envíos reales ni publicación de contenido institucional definitivo. Se requiere repetir la prueba comercial controlada con la configuración real antes del despliegue.
