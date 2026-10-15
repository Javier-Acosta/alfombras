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

Crear primero una colección y luego asociar alfombras. Una alfombra necesita nombre, descripción, imagen y precio entero en centavos ARS. Ejemplo: $150.000 equivale a `15000000`. Medidas y materiales son campos descriptivos opcionales.

Marcar **Vendido** conserva la publicación como muestra y bloquea agregarla al carrito. Despublicar la retira de la tienda. No hay conteo de stock ni reserva automática. El filtro de colección muestra solo los productos de la colección seleccionada; el carrito conserva todos sus productos.

## Configuración y pedidos

En Configuración se editan identidad, logo, colores institucionales, redes, dirección, horarios, enlace al mapa y WhatsApp comercial. La tienda conserva su paleta crema/dorado. No se heredan números, direcciones, cuentas ni contenido de otras aplicaciones.

WhatsApp debe tener entre 8 y 15 dígitos, con código de país y sin `+` ni separadores. Si falta un número válido o el servicio de servidor no tiene credenciales, los pedidos permanecen deshabilitados.

El cliente no necesita cuenta: arma el carrito, ingresa email y confirma. El servidor verifica disponibilidad, cantidades y precios actuales. Si cambia un precio, muestra el nuevo importe y exige otra confirmación. El pedido se guarda pendiente antes de abrir su resumen privado. Desde allí se continúa por WhatsApp. Reintentar el enlace conserva la referencia y no crea otro pedido.

Abrir WhatsApp no demuestra que se haya enviado el mensaje. Pago y entrega se coordinan manualmente; un pedido no reserva unidades ni se marca como pagado. El panel Pedidos muestra el resumen original aunque cambie el catálogo. Conservar el enlace privado del pedido como información de acceso; no compartirlo públicamente.

El carrito se conserva en el mismo navegador. Productos despublicados se señalan como no disponibles y deben quitarse para continuar. Un catálogo vacío muestra “Todavía no hay productos publicados”; una caída de conexión muestra “No pudimos cargar el catálogo”.
