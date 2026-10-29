# Administración de Fábrica de Alfombras Catamarca

## Preparación local

La preparación inicial de este workspace ya dejó PocketBase en `127.0.0.1:8090`, con base vacía, sin contenidos de prueba, y las credenciales de desarrollo en `.local/acceso.txt` (excluido de Git). El WhatsApp queda sin configurar hasta contar con el número real. Ejecutar `npm run dev` para trabajar en `localhost:3000`.

En una instalación nueva en Windows, colocar el ejecutable en `pocketbase/pocketbase.exe` y ejecutar `node scripts/setup-local.mjs` permite repetir esa preparación. Si existe `.env.local` o el puerto está ocupado, el script conserva la configuración existente y no la reemplaza. Los pasos manuales son:

1. Ejecutar `npm ci` con Node.js 24 (mínimo 20.19 para Next.js; las pruebas TypeScript usan Node 24).
2. Instalar PocketBase 0.40.4 en `pocketbase/`. El ejecutable y `pb_data` no se versionan.
3. Desde esa carpeta iniciar `./pocketbase serve` (Windows: `./pocketbase.exe serve`). Las migraciones propias de `pb_migrations` se aplican automáticamente. La base debe ser exclusiva de esta aplicación.
4. Crear un superusuario desde el panel de PocketBase y copiar `.env.example` a `.env.local`, completando las variables de servidor. Las dos URLs de PocketBase deben apuntar a esta misma base; la pública se utiliza para archivos de imagen y debe ser accesible desde el navegador.
5. Para el primer administrador, configurar `STAFF_EMAIL` y `STAFF_PASSWORD` por entorno y ejecutar `node --env-file=.env.local scripts/create-staff.mjs`. El script no modifica contraseñas de usuarios existentes. Luego quitar esas variables temporales.
6. Ejecutar `npm run dev` y entrar a `/admin/login` con la cuenta de `staff`.

El superusuario se utiliza solo en servidor para los pedidos privados. El personal se autentica contra `staff`; no existe registro público ni gestión de cuentas desde la aplicación. Para desactivar una cuenta, eliminarla desde PocketBase o cambiar su contraseña.

## Publicar contenido

- En el panel elegir Noticias, Reels, Banner, Colecciones, Alfombras o las páginas institucionales.
- **Guardar borrador** guarda sin exponer el registro al público.
- **Vista previa** muestra título, imagen y texto; el contenido enriquecido se valida en servidor.
- **Publicar en el sitio** y **Guardar y publicar** habilitan la consulta pública.
- Desmarcar **Publicar en el sitio** permite despublicar. La prioridad más alta aparece primero; los empates se resuelven por fecha de creación. La portada presenta hasta seis noticias y nueve colecciones.
- **Duplicar** copia imagen y contenido como borrador. La fábrica y Proceso artesanal tienen una única página por sección y no se duplican.
- Imágenes PNG/JPEG/WebP de hasta 5 MB; el banner admite hasta 10 MB. El tamaño y contenido real del archivo se validan; un archivo rechazado no reemplaza al anterior.
- Los textos enriquecidos admiten párrafos, énfasis, títulos, listas y enlaces HTTPS. No se admiten scripts, iframes, formularios ni atributos ejecutables.

## Alfombras y colecciones

### Mosaico del Home

En **Mosaico → + Nuevo** se carga una foto propia (PNG, JPEG o WebP, hasta 5 MB) y se pega el **Enlace del diseño o colección**. Acepta enlaces completos del sitio publicado o de la vista local, y direcciones cortas como /alfombras o /lados-de-cama. Los enlaces antiguos por identificador de colección se convierten a su dirección actual. El destino debe estar publicado. El mosaico es independiente de Tienda y admite hasta nueve fotos publicadas. No se muestran títulos ni descripciones sobre las fotos. El título general de la sección sigue siendo configurable.

Marcar **Publicar en el sitio** y guardar publica cada foto. La prioridad más alta aparece primero. Para sustituir una imagen cuando ya hay nueve, editar una existente o despublicar una antes de crear otra. En escritorio se muestran tres columnas y en celular dos. El mosaico sigue arriba de las colecciones; **Mostrar mosaico en el Home** controla toda la sección. Si el destino deja de estar publicado, su foto se oculta del mosaico público.

Las fotos y sus destinos se guardan al guardar cada contenido; **Guardar mosaico** guarda el título general y la activación. **Ver mosaico en el Home** abre el resultado. Un diseño se abre en /disenos/ID y una colección en su dirección propia, por ejemplo /alfombras.

Para instancias existentes, ejecutar node --env-file=.env.local scripts/setup-independent-mosaic.mjs URL_DE_POCKETBASE después de los scripts de mosaico inicial y páginas de colecciones. Agrega mosaic_tiles y conserva las fotos anteriores disponibles como copias independientes enlazadas a sus colecciones; no modifica productos originales. Las instalaciones nuevas aplican las migraciones equivalentes.

Crear primero una colección y luego asociar alfombras. Una alfombra necesita nombre, descripción, imagen y precio entero en centavos ARS. Ejemplo: $150.000 equivale a `15000000`. Medidas y materiales son campos descriptivos opcionales.

Marcar **Vendido** conserva la publicación como muestra y bloquea agregarla al carrito. Despublicar la retira de la tienda. No hay conteo de stock ni reserva automática. El filtro de colección muestra solo los productos de la colección seleccionada; el carrito conserva todos sus productos.

## Configuración y pedidos

En Configuración se editan identidad, logo, colores institucionales, redes, dirección, horarios, enlace al mapa y WhatsApp comercial. El Home, la tienda y el resumen de pedido comparten logo, navegación, pie de página y colores configurados, con la misma tipografía institucional. Los filtros, productos y carrito mantienen su funcionamiento. No se heredan números, direcciones, cuentas ni contenido de otras aplicaciones.

**Color destacado** controla los textos y enlaces que aparecen naranjas por defecto, incluidos **Conocer colección**, **Leer noticia** y los detalles destacados de la tienda. El selector muestra una muestra grande y el código hexadecimal del color elegido. Guardar la configuración y recargar el sitio para ver el cambio.

WhatsApp debe tener entre 8 y 15 dígitos, con código de país y sin `+` ni separadores. Si falta un número válido o el servicio de servidor no tiene credenciales, los pedidos permanecen deshabilitados.

El cliente no necesita cuenta: arma el carrito, ingresa email y confirma. El servidor verifica disponibilidad, cantidades y precios actuales. Si cambia un precio, muestra el nuevo importe y exige otra confirmación. El pedido se guarda pendiente antes de abrir su resumen privado. Desde allí se continúa por WhatsApp. Reintentar el enlace conserva la referencia y no crea otro pedido.

Abrir WhatsApp no demuestra que se haya enviado el mensaje. Pago y entrega se coordinan manualmente; un pedido no reserva unidades ni se marca como pagado. El panel Pedidos muestra el resumen original aunque cambie el catálogo. Conservar el enlace privado del pedido como información de acceso; no compartirlo públicamente.

El mensaje de WhatsApp incluye, por cada alfombra, un enlace que abre su ficha en la tienda y un enlace a su foto pública actual. Si el producto está despublicado, eliminado o no se puede consultar, se conserva el detalle del pedido sin agregar la foto. Los precios siguen siendo los del pedido original. El enlace de WhatsApp prepara texto y no adjunta archivos automáticamente; la vista previa depende de WhatsApp. Configurar `NEXT_PUBLIC_APP_URL` con la URL pública del sitio antes de compartir enlaces fuera del equipo: `localhost` solo funciona en el equipo donde está la aplicación.

En Pedidos, **Confirmar venta** cambia Pendiente a Venta confirmada cuando se acuerda la compra por WhatsApp. **Marcar como entregado** registra que el cliente recibió la alfombra. **Cancelar pedido** está disponible en pendientes y ventas confirmadas y pide confirmación. Los estados tienen listas separadas; el pedido pasa a la lista de su nuevo estado al guardar. Una venta confirmada puede volver a Pendiente; una entrega puede volver a Venta confirmada para corregir un error; un cancelado puede volver a Pendiente. El resumen privado del cliente muestra el estado vigente. Ningún cambio registra cobros ni modifica automáticamente productos vendidos o existencias.

**Archivar pedido** retira un pedido de su lista y **Archivar todos los pendientes** (o **Archivar todos los mostrados**, en otros estados) vacía la lista visible después de confirmar. Los registros se conservan en **Archivados**, con su estado, referencia, contacto e importes originales. **Volver a pendientes** o **Recuperar pedido** permite recuperarlos en la lista de su estado actual. Para cambiar el estado de un archivado, primero recuperarlo. Archivar no confirma pago ni entrega, no cambia el stock y conserva el enlace privado del cliente. Los pedidos nuevos aparecen en Pendientes y no se archivan automáticamente.

En instancias externas, ejecutar `node --env-file=.env.local scripts/setup-order-archive.mjs URL_DE_POCKETBASE` para agregar el campo de archivo sin modificar registros ni permisos. Las instalaciones locales lo agregan mediante las migraciones de `pocketbase/pb_migrations`.

Para habilitar los estados en instancias externas, ejecutar `node --env-file=.env.local scripts/setup-order-status.mjs URL_DE_POCKETBASE`. El script amplía las opciones admitidas sin cambiar el estado de pedidos existentes ni sus permisos. Las instalaciones locales aplican la migración equivalente.

**Descargar PDF** está disponible en cada pedido, también en Archivados. Genera un registro interno con referencia, fecha del pedido, email de contacto, estado actual, detalle de productos, cantidades, precios unitarios, subtotales y total en ARS. Conserva los importes originales del pedido aunque cambie el catálogo, incluye fecha de generación y pagina los pedidos extensos. Requiere sesión del personal y no modifica ningún dato. El documento no es factura ni comprobante de pago. Guardar cada descarga si se necesita conservar una copia del estado a esa fecha.

En **Ventas confirmadas**, **Imprimir ventas confirmadas** descarga un informe PDF con todas las ventas de la lista visible, su detalle, la cantidad de ventas y el total general en pesos. **Desde / Hasta** filtra por fecha de creación del pedido, incluyendo ambos días completos en horario de Argentina; no por fecha de confirmación ni cobro. Se puede completar solo un extremo o dejar ambos vacíos para incluir todas. El filtro actualiza la lista y su total; **Limpiar fechas** muestra todas nuevamente. No incluye pedidos entregados, cancelados, pendientes ni archivados. El servidor vuelve a consultar los datos al generar el informe para reflejar el estado vigente. El PDF permite conservar una copia, tiene numeración de páginas y sigue siendo un registro interno sin acreditar pagos.

El carrito se conserva en el mismo navegador. Productos despublicados se señalan como no disponibles y deben quitarse para continuar. Un catálogo vacío muestra “Todavía no hay productos publicados”; una caída de conexión muestra “No pudimos cargar el catálogo”.


En Colecciones se administran la foto, título, descripción y dirección de cada página. Por ejemplo, la dirección alfombras abre /alfombras; usar minúsculas, números y guiones, sin barra inicial. Las tarjetas del Home solo muestran foto y título y abren esa página. Los enlaces antiguos por identificador redirigen a la dirección configurada.

En Diseños se cargan piezas independientes de Tienda, sin precio: nombre, descripción, colección, foto principal y hasta diez fotos adicionales (PNG, JPEG o WebP, 5 MB por foto). Publicar el diseño y su colección para que aparezcan en la página correspondiente. Los productos de Tienda se conservan por separado y no se copian automáticamente. Las fotos se pueden recorrer desde cada tarjeta del diseño.

Para preparar una instancia externa, ejecutar node --env-file=.env.local scripts/setup-collection-pages.mjs URL_DE_POCKETBASE. Agrega Diseños y las direcciones, conserva las direcciones existentes y asigna direcciones a las colecciones antiguas.
