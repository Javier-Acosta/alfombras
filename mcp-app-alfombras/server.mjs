#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const slug = "mcp-app-alfombras";
const version = "1.0.0";
const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(serverDirectory, "..");
const projectEnvPath = process.env.CONNECTOR_ENV_PATH || join(projectDirectory, ".env.local");

const requiredEnv = [
  "POCKETBASE_URL",
  "POCKETBASE_SUPERUSER_EMAIL",
  "POCKETBASE_SUPERUSER_PASSWORD",
];

const optionalEnv = [];

const openspecArtifacts = {
  proposal: "openspec/changes/fabrica-alfombras-catamarca/proposal.md",
  config: "openspec/config.yaml",
};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function failure(id, code, message) {
  if (id !== undefined) {
    send({ jsonrpc: "2.0", id, error: { code, message } });
  }
}

function loadEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const value = line.slice(index + 1).trim().replace(/^[ '"]|[ '"]$/g, "");
        return [line.slice(0, index).trim(), value];
      }),
  );
}

async function ensureEnvFile() {
  try {
    await access(projectEnvPath, constants.F_OK);
    return { created: false, path: projectEnvPath };
  } catch {
    const template = [
      "# Alfombras - variables locales",
      "# Completa estos valores localmente. No pegues secretos en el chat.",
      "POCKETBASE_URL=http://127.0.0.1:8090",
      "POCKETBASE_SUPERUSER_EMAIL=",
      "POCKETBASE_SUPERUSER_PASSWORD=",
      "",
    ].join("\n");
    await mkdir(dirname(projectEnvPath), { recursive: true });
    await writeFile(projectEnvPath, template, { encoding: "utf8", flag: "wx" });
    return { created: true, path: projectEnvPath };
  }
}

async function readPrivateEnv() {
  let contents;
  try {
    contents = await readFile(projectEnvPath, "utf8");
  } catch {
    throw new Error(`Falta ${projectEnvPath}. Ejecuta: node ${join(serverDirectory, "server.mjs")} --setup`);
  }

  const env = loadEnv(contents);
  const missing = requiredEnv.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables en ${projectEnvPath}: ${missing.join(", ")}.`);
  }

  const url = new URL(env.POCKETBASE_URL);
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("POCKETBASE_URL debe empezar con http:// o https://.");
  }

  return {
    url: url.toString().replace(/\/$/, ""),
    email: env.POCKETBASE_SUPERUSER_EMAIL,
    password: env.POCKETBASE_SUPERUSER_PASSWORD,
  };
}

async function readRepoFile(relativePath) {
  const target = resolve(projectDirectory, relativePath);
  if (!target.startsWith(projectDirectory + "/") && !target.startsWith(projectDirectory + "\\")) {
    throw new Error("Lectura fuera del proyecto rechazada.");
  }
  return readFile(target, "utf8");
}

async function pbRequest(path, { method = "GET", query = {}, body, token } = {}) {
  const env = await readPrivateEnv();
  const url = new URL(path, env.url + "/");
  if (url.origin !== new URL(env.url).origin || !url.pathname.startsWith("/api/")) {
    throw new Error("Ruta fuera de la API de PocketBase rechazada.");
  }

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = data?.message || response.statusText || "PocketBase request failed";
    throw new Error(`PocketBase HTTP ${response.status}: ${message}`);
  }

  return data;
}

async function superuserToken() {
  const env = await readPrivateEnv();
  const payload = { identity: env.email, password: env.password };
  const attempts = [
    ["/api/collections/_superusers/auth-with-password", payload],
    ["/api/admins/auth-with-password", { email: env.email, password: env.password }],
  ];

  let lastError;
  for (const [path, body] of attempts) {
    try {
      const auth = await pbRequest(path, { method: "POST", body });
      if (auth?.token) {
        return auth.token;
      }
      lastError = new Error("PocketBase no devolvio token de superusuario.");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No se pudo autenticar con PocketBase.");
}

function positiveInt(value, fallback, max = 100) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`El valor debe ser un entero entre 1 y ${max}.`);
  }
  return number;
}

function safeSegment(value, name) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`${name} contiene caracteres no permitidos.`);
  }
  return value;
}

function publicTool(tool) {
  const clone = { ...tool, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true } };
  delete clone.execute;
  return clone;
}

const tools = [
  {
    name: "alfombras_context",
    description: "Devuelve contexto de alto nivel del proyecto Alfombras.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => ({
      project: "alfombras",
      stack: ["Next.js 16.4.0", "React 19.3.0", "Tailwind CSS 4", "PocketBase"],
      scope: [
        "Publicar y explorar alfombras alfombrass.",
        "Consultar colecciones y registros de PocketBase.",
        "Leer la especificacion del proyecto.",
        
      ],
      projectDirectory,
    }),
  },
  {
    name: "alfombras_openspec",
    description: "Lee artefactos OpenSpec del cambio inicial de alfombras.",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "string", enum: Object.keys(openspecArtifacts) },
      },
      required: ["artifact"],
      additionalProperties: false,
    },
    execute: async ({ artifact }) => readRepoFile(openspecArtifacts[artifact]),
  },
  {
    name: "alfombras_env_keys",
    description: "Lista variables de entorno esperadas sin exponer valores.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => ({
      required: requiredEnv,
      optional: optionalEnv,
      envFile: projectEnvPath,
    }),
  },
  {
    name: "alfombras_pocketbase_health",
    description: "Comprueba si la instancia PocketBase configurada responde.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => pbRequest("/api/health"),
  },
  {
    name: "alfombras_list_collections",
    description: "Lista colecciones de PocketBase. Requiere superusuario en el archivo privado del conector.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, maximum: 1000 },
        perPage: { type: "integer", minimum: 1, maximum: 100 },
        sort: { type: "string" },
        filter: { type: "string" },
      },
      additionalProperties: false,
    },
    execute: async (args) => pbRequest("/api/collections", {
      token: await superuserToken(),
      query: {
        page: positiveInt(args.page, 1, 1000),
        perPage: positiveInt(args.perPage, 30, 100),
        sort: args.sort,
        filter: args.filter,
      },
    }),
  },
  {
    name: "alfombras_get_collection",
    description: "Obtiene la configuracion de una coleccion por nombre o id.",
    inputSchema: {
      type: "object",
      properties: { collection: { type: "string", minLength: 1, maxLength: 128 } },
      required: ["collection"],
      additionalProperties: false,
    },
    execute: async ({ collection }) => pbRequest(`/api/collections/${encodeURIComponent(safeSegment(collection, "collection"))}`, {
      token: await superuserToken(),
    }),
  },
  {
    name: "alfombras_list_records",
    description: "Lista registros de una coleccion usando la API de PocketBase.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", minLength: 1, maxLength: 128 },
        page: { type: "integer", minimum: 1, maximum: 1000 },
        perPage: { type: "integer", minimum: 1, maximum: 100 },
        sort: { type: "string" },
        filter: { type: "string" },
        expand: { type: "string" },
        fields: { type: "string" },
      },
      required: ["collection"],
      additionalProperties: false,
    },
    execute: async (args) => pbRequest(`/api/collections/${encodeURIComponent(safeSegment(args.collection, "collection"))}/records`, {
      token: await superuserToken(),
      query: {
        page: positiveInt(args.page, 1, 1000),
        perPage: positiveInt(args.perPage, 30, 100),
        sort: args.sort,
        filter: args.filter,
        expand: args.expand,
        fields: args.fields,
      },
    }),
  },
  {
    name: "alfombras_get_record",
    description: "Obtiene un registro por coleccion e id.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", minLength: 1, maxLength: 128 },
        id: { type: "string", minLength: 1, maxLength: 128 },
        expand: { type: "string" },
        fields: { type: "string" },
      },
      required: ["collection", "id"],
      additionalProperties: false,
    },
    execute: async (args) => pbRequest(`/api/collections/${encodeURIComponent(safeSegment(args.collection, "collection"))}/records/${encodeURIComponent(safeSegment(args.id, "id"))}`, {
      token: await superuserToken(),
      query: { expand: args.expand, fields: args.fields },
    }),
  },
  {
    name: "alfombras_raw_get",
    description: "Ejecuta un GET de solo lectura contra una ruta /api de PocketBase.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", minLength: 1, maxLength: 256 },
        authenticated: { type: "boolean" },
      },
      required: ["path"],
      additionalProperties: false,
    },
    execute: async ({ path, authenticated }) => {
      if (!path.startsWith("/api/")) {
        throw new Error("path debe empezar con /api/.");
      }
      return pbRequest(path, { token: authenticated ? await superuserToken() : undefined });
    },
  },
];

async function setup() {
  const env = await ensureEnvFile();
  process.stdout.write(`${env.created ? "Creado" : "Ya existe"}: ${env.path}\n`);
}

async function test() {
  await pbRequest("/api/health");
  const token = await superuserToken();
  await pbRequest("/api/collections", { token, query: { page: 1, perPage: 1 } });
  process.stdout.write("PocketBase: conexion, autenticacion y lectura de colecciones verificadas.\n");
}

async function callTool(name, args = {}) {
  const tool = tools.find((item) => item.name === name);
  if (!tool) {
    throw new Error("Herramienta no encontrada.");
  }
  const data = await tool.execute(args);
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function handle(message) {
  const { id, method, params = {} } = message;

  if (id === undefined) return;

  if (method === "initialize") {
    return result(id, {
      protocolVersion: params.protocolVersion || "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: slug, version },
    });
  }

  if (method === "ping") return result(id, {});

  if (method === "tools/list") {
    return result(id, { tools: tools.map(publicTool) });
  }

  if (method === "tools/call") {
    try {
      return result(id, await callTool(params.name, params.arguments || {}));
    } catch (error) {
      return result(id, {
        content: [{ type: "text", text: error.message || "Error desconocido." }],
        isError: true,
      });
    }
  }

  failure(id, -32601, `Metodo no soportado: ${method}`);
}

const command = process.argv[2];
if (command === "--setup") {
  await setup();
} else if (command === "--test") {
  try {
    await test();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
} else if (command === "--where") {
  process.stdout.write(`${projectEnvPath}\n`);
} else {
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    try {
      await handle(JSON.parse(line));
    } catch (error) {
      failure(null, -32700, "Solicitud JSON invalida.");
    }
  }
}
