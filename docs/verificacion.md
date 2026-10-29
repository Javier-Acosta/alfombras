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
- Encabezado, logo, navegación, pie, fuente y colores compartidos entre Home, tienda y resumen de pedido; navegación móvil, ausencia de desbordamiento y conservación del carrito al volver al inicio.
- Fotografía ampliada, Escape y devolución de foco; carrito persistente y almacenamiento inválido.
- Fallo temporal de envío conservando carrito, precio cambiado y segunda confirmación.
- Pedido guardado antes de WhatsApp, resumen privado y reintentos concurrentes sin duplicación.
- Login, logout, acceso directo no autenticado y origen no permitido.
- Guardar borrador, publicar, ordenar y duplicar noticias con imagen.
- Catálogo vacío y catálogo inaccesible diferenciados; archivos falsos o sobredimensionados rechazados sin reemplazar la imagen.
- Cambios de configuración visibles al público y rechazo de un WhatsApp inválido.
- Guardar Color destacado desde el panel, conservarlo al recargar y aplicarlo a Conocer colección, Leer noticia, ubicación y acentos de la tienda; selector legible en escritorio y móvil.
- Mosaico del Home: nueve fotos independientes, carga desde el panel, destinos a colección y diseño, ausencia de texto sobre fotos, límite de publicaciones, ocultamiento de destinos no publicados, adaptación móvil y permisos.
- Borradores, pedidos y alta de personal inaccesibles públicamente.
- Archivo individual y masivo, recuperación de pedidos y conservación de sus datos.
- Venta confirmada, entrega, cancelación y corrección de estados; filtros y resumen privado actualizados, rechazo de estados inválidos, solicitudes ajenas y cambios de importes.
- PDF individual autenticado, con importes del pedido original, descarga desde Archivados, paginación de pedidos extensos y mensaje ante fallos. Verificar el texto con pypdf y renderizar las páginas con Poppler para revisar el diseño.
- Informe de ventas confirmadas con total general, filtro inclusivo por fecha de pedido en horario de Argentina, límites abiertos, fechas inválidas y período vacío. Exclusión de otros estados y archivados, autenticación y ausencia de cambios en los registros.

La validación no incluye cobros, envíos reales ni publicación de contenido institucional definitivo. Se requiere repetir la prueba comercial controlada con la configuración real antes del despliegue.
