/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const staffRule = "@request.auth.collectionName = 'staff'";
    function find(name) {
      try {
        return app.findCollectionByNameOrId(name);
      } catch {
        return null;
      }
    }
    function ensure(name, fields, options) {
      const old = find(name);
      if (old) return old;
      const c = new Collection(
        Object.assign(
          {
            name: name,
            type: "base",
            listRule: "published = true || (" + staffRule + ")",
            viewRule: "published = true || (" + staffRule + ")",
            createRule: staffRule,
            updateRule: staffRule,
            deleteRule: staffRule,
            fields: fields.concat([
              { name: "created", type: "autodate", onCreate: true },
              {
                name: "updated",
                type: "autodate",
                onCreate: true,
                onUpdate: true,
              },
            ]),
          },
          options || {},
        ),
      );
      app.save(c);
      return c;
    }
    ensure("staff", [{ name: "name", type: "text", max: 120 }], {
      type: "auth",
      listRule: null,
      viewRule: "id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      authRule: "",
      passwordAuth: { enabled: true, identityFields: ["email"] },
    });
    function text(name, required, max) {
      return {
        name: name,
        type: "text",
        required: !!required,
        max: max || 200,
      };
    }
    function image(max, required) {
      return {
        name: "image",
        type: "file",
        required: !!required,
        maxSelect: 1,
        maxSize: max || 5242880,
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
      };
    }
    const common = [
      { name: "published", type: "bool" },
      { name: "priority", type: "number", min: 0, max: 9999, onlyInt: true },
    ];
    ensure(
      "news",
      [
        text("title", true),
        text("summary", true, 2000),
        { name: "content", type: "editor", maxSize: 100000, required: true },
        { name: "published_on", type: "date", required: true },
        image(),
      ].concat(common),
    );
    ensure(
      "reels",
      [
        text("title", true),
        {
          name: "url",
          type: "url",
          required: true,
          onlyDomains: ["instagram.com", "www.instagram.com"],
        },
        image(),
      ].concat(common),
    );
    ensure(
      "banners",
      [text("title", true), image(10485760, true)].concat(common),
    );
    ensure(
      "institutional_pages",
      [
        {
          name: "key",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["factory", "process"],
        },
        text("title", true),
        { name: "content", type: "editor", maxSize: 100000, required: true },
        image(),
      ].concat(common),
      {
        indexes: [
          "CREATE UNIQUE INDEX idx_institutional_key ON institutional_pages (key)",
        ],
      },
    );
    const collections = ensure(
      "collections",
      [
        text("name", true),
        text("description", true, 5000),
        image(5242880, true),
      ].concat(common),
    );
    ensure(
      "products",
      [
        text("name", true),
        text("description", true, 5000),
        {
          name: "priceMinor",
          type: "number",
          required: true,
          min: 1,
          max: 100000000000,
          onlyInt: true,
        },
        {
          name: "currency",
          type: "select",
          maxSelect: 1,
          values: ["ARS"],
          required: true,
        },
        text("measurements", false),
        text("materials", false),
        {
          name: "collection",
          type: "relation",
          collectionId: collections.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        image(5242880, true),
        { name: "sold", type: "bool" },
      ].concat(common),
    );
    ensure(
      "orders",
      [
        text("reference", true),
        text("tokenHash", true, 64),
        text("idempotencyKey", true, 64),
        text("requestHash", true, 64),
        { name: "email", type: "email", required: true },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["pending"],
          required: true,
        },
        { name: "items", type: "json", required: true, maxSize: 100000 },
        {
          name: "totalMinor",
          type: "number",
          min: 1,
          max: 10000000000000,
          onlyInt: true,
          required: true,
        },
        {
          name: "currency",
          type: "select",
          maxSelect: 1,
          values: ["ARS"],
          required: true,
        },
      ],
      {
        listRule: staffRule,
        viewRule: staffRule,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        indexes: [
          "CREATE UNIQUE INDEX idx_order_token ON orders (tokenHash)",
          "CREATE UNIQUE INDEX idx_order_key ON orders (idempotencyKey)",
        ],
      },
    );
    ensure(
      "site_settings",
      [
        text("site_name", true),
        text("description", false, 350),
        text("footer_text", false, 350),
        text("address", false, 2000),
        text("hours", false, 1000),
        {
          name: "whatsapp",
          type: "text",
          pattern: "^[1-9][0-9]{7,14}$",
          max: 15,
        },
        ...["map_url", "instagram_url", "facebook_url", "youtube_url"].map(
          (name) => ({ name: name, type: "url" }),
        ),
        ...[
          "accent_color",
          "background_color",
          "surface_color",
          "news_color",
          "text_color",
        ].map((name) => ({
          name: name,
          type: "text",
          required: true,
          pattern: "^#[0-9A-Fa-f]{6}$",
        })),
        {
          name: "logo",
          type: "file",
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/png", "image/jpeg", "image/webp"],
        },
      ],
      {
        listRule: "",
        viewRule: "",
        createRule: null,
        updateRule: staffRule,
        deleteRule: null,
      },
    );
    let record;
    try {
      record = app.findRecordById("site_settings", "alfombrasconfig");
    } catch {
      /* seed only once */
    }
    if (!record) {
      record = new Record(app.findCollectionByNameOrId("site_settings"));
      record.set("id", "alfombrasconfig");
      const defaults = {
        site_name: "Fábrica de Alfombras Catamarca",
        description:
          "La fábrica, el proceso artesanal y las colecciones de alfombras de Catamarca.",
        footer_text: "Fábrica de Alfombras Catamarca",
        accent_color: "#ED8023",
        background_color: "#f7f4ee",
        surface_color: "#ffffff",
        news_color: "#f0d9e9",
        text_color: "#101128",
      };
      for (const key in defaults) record.set(key, defaults[key]);
      app.save(record);
    }
  },
  () => {
    // No eliminar datos comerciales automáticamente al revertir: restaurar un respaldo verificado.
  },
);
