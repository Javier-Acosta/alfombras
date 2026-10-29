migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("home_mosaic");
    } catch {
      const staff = "@request.auth.collectionName = 'staff'";
      collection = new Collection({
        name: "home_mosaic",
        type: "base",
        listRule: `enabled = true || (${staff})`,
        viewRule: `enabled = true || (${staff})`,
        createRule: null,
        updateRule: staff,
        deleteRule: null,
        fields: [
          { name: "title", type: "text", required: true, max: 80 },
          { name: "enabled", type: "bool" },
          {
            name: "products",
            type: "relation",
            collectionId: app.findCollectionByNameOrId("products").id,
            maxSelect: 5,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }
    try {
      app.findRecordById(collection.id, "mosaicconfig001");
    } catch {
      const record = new Record(collection);
      record.set("id", "mosaicconfig001");
      record.set("title", "Piezas destacadas");
      record.set("enabled", false);
      app.save(record);
    }
  },
  () => {
    // Conservar la selección de productos al revertir.
  },
);
