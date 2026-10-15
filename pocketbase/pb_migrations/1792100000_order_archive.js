migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("orders");
    if (!collection.fields.getByName("archived")) {
      collection.fields.add(new BoolField({ name: "archived" }));
      app.save(collection);
    }
  },
  () => {
    // Conservar el historial al revertir; no eliminar datos automáticamente.
  },
);
