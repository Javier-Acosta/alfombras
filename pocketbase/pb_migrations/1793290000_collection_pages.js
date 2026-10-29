migrate((app) => {
  const collections = app.findCollectionByNameOrId("collections");
  if (!collections.fields.getByName("slug")) collections.fields.add(new TextField({name:"slug",max:80,pattern:"^[a-z0-9]+(-[a-z0-9]+)*$"}));
  if (!collections.indexes.some(i => i.includes("idx_collection_slug"))) collections.indexes.push("CREATE UNIQUE INDEX idx_collection_slug ON collections (slug) WHERE slug != ''");
  app.save(collections);
  // Las direcciones existentes se conservan. El script de preparación asigna direcciones a colecciones anteriores.
  try {app.findCollectionByNameOrId("designs"); return;} catch {}
  const staff = "@request.auth.collectionName = 'staff'";
  app.save(new Collection({name:"designs",type:"base",listRule:`(published = true && collection.published = true) || (${staff})`,viewRule:`(published = true && collection.published = true) || (${staff})`,createRule:staff,updateRule:staff,deleteRule:staff,fields:[
    {name:"name",type:"text",required:true,max:200}, {name:"description",type:"text",required:true,max:5000},
    {name:"collection",type:"relation",required:true,collectionId:collections.id,maxSelect:1,cascadeDelete:false},
    {name:"image",type:"file",required:true,maxSelect:1,maxSize:5242880,mimeTypes:["image/jpeg","image/png","image/webp"]},
    {name:"gallery",type:"file",maxSelect:10,maxSize:5242880,mimeTypes:["image/jpeg","image/png","image/webp"],thumbs:["160x160"]},
    {name:"published",type:"bool"},{name:"priority",type:"number",onlyInt:true,min:0,max:9999},
    {name:"created",type:"autodate",onCreate:true},{name:"updated",type:"autodate",onCreate:true,onUpdate:true}
  ]}));
}, () => { /* Conservar diseños y direcciones al revertir para evitar pérdida de contenido. */ });
