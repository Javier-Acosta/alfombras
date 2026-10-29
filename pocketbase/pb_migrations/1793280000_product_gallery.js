migrate((app) => {
  const collection = app.findCollectionByNameOrId("products");
  if (!collection.fields.getByName("gallery")) {
    collection.fields.add(new FileField({ name: "gallery", maxSelect: 10, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"], thumbs: ["160x160"], protected: false }));
    app.save(collection);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("products");
  collection.fields.removeByName("gallery");
  app.save(collection);
});
