migrate((app) => {
  try { app.findCollectionByNameOrId("mosaic_tiles"); return; } catch {}
  const staff = "@request.auth.collectionName = 'staff'";
  app.save(new Collection({name:"mosaic_tiles",type:"base",listRule:`published = true || (${staff})`,viewRule:`published = true || (${staff})`,createRule:staff,updateRule:staff,deleteRule:staff,fields:[
    {name:"image",type:"file",required:true,maxSelect:1,maxSize:5242880,mimeTypes:["image/jpeg","image/png","image/webp"],thumbs:["600x450"]},
    {name:"target",type:"text",required:true,max:180},
    {name:"published",type:"bool"},{name:"priority",type:"number",onlyInt:true,min:0,max:9999},
    {name:"created",type:"autodate",onCreate:true},{name:"updated",type:"autodate",onCreate:true,onUpdate:true}
  ]}));
},()=>{/* Conservar fotos independientes al revertir. */});
