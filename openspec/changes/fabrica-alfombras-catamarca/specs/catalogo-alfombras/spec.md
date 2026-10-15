# Spec Delta

## Purpose

Permitir descubrir las colecciones de la fábrica y consultar alfombras publicadas en una tienda con la presentación de Tienda Cata.

## ADDED Requirements

### Requirement: Tienda con diseño de referencia
La tienda SHALL conservar el diseño de Tienda Cata: fondo crema, acentos dorados, título serif, tarjetas blancas, imágenes completas y carrito lateral en escritorio, apilado en móvil.

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
