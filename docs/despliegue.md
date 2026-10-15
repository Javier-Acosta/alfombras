# Preparación de publicación

## Datos reales pendientes

- Logo y banner propios; fotografías de colecciones y alfombras, con permiso de uso.
- Historia de la fábrica y descripción del proceso artesanal.
- Nombres, descripciones, medidas, materiales y precios reales.
- Dirección, horarios, enlace al mapa y redes oficiales.
- WhatsApp comercial verificado y URL pública definitiva.
- Instancia PocketBase exclusiva y cuentas del personal.

La aplicación no incorpora datos ni credenciales de Feria del Libro o Tienda Cata. Los fixtures sintéticos se generan únicamente en `.test-runtime`, base local separada de producción.

## Entorno de producción

Usar Node.js 24 y PocketBase 0.40.4. Ejecutar `npm ci`, configurar las variables de `.env.example`, ejecutar `npm run build` y `npm start`. `NEXT_PUBLIC_POCKETBASE_URL` se incorpora al compilar: recompilar al cambiarla. Debe ser HTTPS en producción; `POCKETBASE_URL` puede ser una dirección interna del mismo servicio. Las credenciales privilegiadas nunca usan el prefijo `NEXT_PUBLIC_`.

Configurar `NEXT_PUBLIC_APP_URL` con el origen HTTPS real, sin path; se usa para comprobar el origen de las mutaciones. Configurar el proxy para sobrescribir `X-Real-IP` con la dirección real del cliente, sin confiar en el valor entrante. Agregar rate limiting en el proxy si hay varias réplicas; el límite de aplicación es por proceso (pedidos: 12/minuto; login: 10/minuto). Limitar las cargas HTTP a 12 MB. Servir la app por HTTPS para que la cookie Secure funcione correctamente.

Guardar datos y archivos de PocketBase en volumen persistente. Aplicar migraciones solo después de comprobar la URL destino y crear un respaldo. La migración inicial se registra una vez y no elimina datos al revertir.

Antes de habilitar ventas: revisar reglas con sesión pública, configurar WhatsApp, cargar material aprobado y hacer un pedido de verificación coordinado con el personal. La lista de pedidos contiene datos personales y requiere sesión; el enlace de cada pedido es un acceso privado con token aleatorio.

## Respaldo y reversión

Respaldar base, archivos y configuración privada usando el mecanismo de backup de PocketBase o con el servicio detenido; conservar copia fuera del host. Registrar la versión de aplicación y migraciones desplegadas.

Ante fallo de código, volver a la versión anterior y reiniciar la aplicación sin borrar la base. Ante fallo de esquema, detener escrituras, exportar los pedidos creados desde el respaldo y verificar una restauración en un entorno separado antes de reemplazar datos. La reversión no borra pedidos automáticamente.

## Comprobaciones

`npm run lint`, `npm run build`, `npm run test:unit` y `npm run test:e2e`. Ver `docs/verificacion.md` para preparar el entorno descartable. Ninguna prueba envía mensajes de WhatsApp.
