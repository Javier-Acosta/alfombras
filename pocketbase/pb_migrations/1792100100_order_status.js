migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("orders");
    const field = collection.fields.getByName("status");
    field.values = [
      ...new Set([
        ...field.values,
        "pending",
        "confirmed",
        "delivered",
        "cancelled",
      ]),
    ];
    app.save(collection);
  },
  () => {
    // Conservar los estados y los datos existentes al revertir.
  },
);
