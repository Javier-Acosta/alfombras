# Spec Delta

## Purpose

Permitir descubrir las colecciones de la fábrica y consultar los productos publicados en una tienda integrada visualmente con el sitio institucional.

## ADDED Requirements

### Requirement: Mosaico de fotos independientes
El Home SHALL ofrecer una sección con hasta nueve fotos propias, independientes de Tienda, sin títulos ni descripciones sobre las imágenes. El personal SHALL poder cargar fotos, elegir como destino una colección o un diseño publicado, ordenar mediante prioridad y activar o desactivar la sección. El mosaico SHALL usar tres columnas en escritorio y dos en móvil.

#### Scenario: Configurar y visitar una imagen
- **WHEN** el personal publica fotos con destinos y el visitante selecciona una
- **THEN** se abre la página de la colección o del diseño configurado, sin pasar por Tienda.

#### Scenario: Destino despublicado o mosaico desactivado
- **WHEN** un destino deja de estar publicado o se desactiva el mosaico
- **THEN** se oculta la imagen correspondiente o toda la sección, conservando las fotos guardadas.

### Requirement: Tienda con identidad institucional compartida
La tienda SHALL compartir con el Home el encabezado, logo, menú completo, pie de página, colores configurados y tipografía institucional. El catálogo SHALL conservar imágenes completas y carrito lateral en escritorio, apilado en móvil, manteniendo sus filtros y flujo de pedido.

#### Scenario: Continuidad entre Home y tienda
- **WHEN** se navega del Home a la tienda y se vuelve al inicio
- **THEN** se conservan el logo, navegación, tipografía y colores institucionales, sin presentar una marca comercial distinta.

#### Scenario: Consulta de un producto
- **WHEN** se abre `/tienda` y se selecciona una alfombra
- **THEN** se muestra su fotografía ampliada, nombre, descripción, precio en ARS y disponibilidad, con controles accesibles por teclado.

### Requirement: Colecciones vinculadas al catálogo
El sitio SHALL ofrecer listado y detalle de colecciones publicadas con imagen, descripción y enlace a sus alfombras publicadas en la tienda.

#### Scenario: Explorar una colección
- **WHEN** se abre una colección publicada
- **THEN** se ve su presentación y se puede abrir la tienda filtrada por esa colección.

### Requirement: Información comercial de las alfombras
Cada alfombra publicada SHALL mostrar nombre, descripción, imagen y precio; las medidas, materiales y colección se mostrarán cuando estén cargados. Las alfombras vendidas SHALL identificarse y bloquear su incorporación al carrito.

#### Scenario: Alfombra vendida
- **WHEN** una alfombra publicada está marcada como vendida
- **THEN** sigue siendo consultable con la etiqueta Vendido y sin opción de agregarla al carrito.

#### Scenario: Alfombra despublicada
- **WHEN** una alfombra pasa a borrador o se elimina
- **THEN** deja de estar disponible para consulta pública y para nuevos pedidos.

### Requirement: Catálogo vacío o no disponible
La tienda SHALL distinguir un catálogo sin publicaciones de un fallo de carga y ofrecer un mensaje comprensible en ambos casos.

#### Scenario: Fallo de conexión
- **WHEN** no se puede consultar el catálogo
- **THEN** se informa la indisponibilidad temporal sin afirmar que no existen productos.
