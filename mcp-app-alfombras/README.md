# mcp-app-alfombras

Servidor local MCP por stdio, Node.js 18 o posterior, sin dependencias adicionales.
Ofrece contexto del proyecto, propuesta OpenSpec, nombres de variables, salud de
PocketBase, consulta de colecciones/esquemas, registros con filtros y paginacion,
y GET generico a la API. No ofrece modificaciones de datos.

Credenciales privadas: `.env.local` en la raiz del proyecto.
Respeta `CONNECTOR_ENV_PATH` para una ruta alternativa. Nunca imprime sus valores.

```powershell
node mcp-app-alfombras/server.mjs --setup
node mcp-app-alfombras/server.mjs --where
node mcp-app-alfombras/server.mjs --test
node --test mcp-app-alfombras/server.test.mjs
codex mcp add mcp-app-alfombras -- node C:/Proyectos/alfombras/mcp-app-alfombras/server.mjs
```

`--setup` crea el archivo privado sin sobrescribirlo. Completar `POCKETBASE_URL`
con la direccion del servidor (local por defecto: `http://127.0.0.1:8090`).
`POCKETBASE_SUPERUSER_EMAIL` y `POCKETBASE_SUPERUSER_PASSWORD` son los datos
del superusuario creado por el administrador de PocketBase en `/_/`;
pueden estar guardados previamente en el gestor de contrasenas de la instalacion.
No copiar credenciales al chat. `--test` verifica la conexion real, la autenticacion
y la lectura de colecciones. El contexto y OpenSpec funcionan sin conexion a PocketBase.

Fuentes de implementacion: servidor MCP local de Inmobiliaria y documentacion
oficial consultada el 2026-10-14:

- https://developers.openai.com/codex/mcp
- https://pocketbase.io/docs/api-records/
- https://pocketbase.io/docs/api-collections/
- https://pocketbase.io/docs/api-health/

API: GET `/api/health`, GET `/api/collections`, GET `/api/collections/{collection}`,
GET `/api/collections/{collection}/records`, GET `/api/collections/{collection}/records/{id}`.
Autenticacion: POST `/api/collections/_superusers/auth-with-password` con
`{identity, password}`; el token se usa en `Authorization: Bearer <token>`.
Compatibilidad antigua: `/api/admins/auth-with-password`.
Listados aceptan `page`, `perPage`, `filter`, `sort`; registros tambien `expand`
y `fields`. Respuesta paginada: `{page,perPage,totalItems,totalPages,items}`.
El GET generico permite consultar otros endpoints de lectura de la instancia.
Solo se permiten destinos `/api/` del mismo origen, sin redirecciones y con
tiempo maximo de 15 segundos por solicitud.
