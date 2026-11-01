import{connect}from'./sdk/browser.js';
import{IDENTITY,apply,equal,dimensions,outputName,pngName}from'./transforms.mjs';
const $=id=>document.getElementById(id),canvas=$('canvas'),MAX_BYTES=24*1024*1024;
const TYPES=['image/png','image/jpeg','image/webp','image/avif','image/gif','image/bmp','.png','.jpg','.jpeg','.webp','.avif','.gif','.bmp'];
let ink,bitmap,source,matrix=[...IDENTITY],savedMatrix=[...IDENTITY],undo=[],busy=false,loadBusy=false,loading=0,lastSaved,drops;
const dirty=()=>!!bitmap&&!equal(matrix,savedMatrix);
const status=text=>$('status').textContent=text;
function error(e){$('error').textContent=e.message||String(e);$('error').hidden=false;}
function render(){
  const blocked=busy||loadBusy;
  for(const id of ['left','right','horizontal','vertical','reset'])$(id).disabled=!bitmap||blocked||(id==='reset'&&equal(matrix,IDENTITY));
  $('undo').disabled=!undo.length||blocked;$('save').disabled=!dirty()||blocked;$('filename').disabled=!bitmap||blocked;$('open').disabled=$('upload').disabled=!ink||blocked;
  $('save').textContent=busy?'Saving…':'Save copy';$('preview').hidden=!lastSaved;$('preview').disabled=busy;
  $('empty').hidden=!!bitmap;canvas.hidden=!bitmap;if(!bitmap)return;
  const size=dimensions(bitmap.width,bitmap.height,matrix);canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('This browser cannot edit images.');ctx.imageSmoothingEnabled=false;ctx.translate(size.width/2,size.height/2);ctx.transform(...matrix,0,0);ctx.drawImage(bitmap,-bitmap.width/2,-bitmap.height/2);
  $('dimensions').textContent=size.width+' × '+size.height+' px';$('name').textContent=source.title||source.source||'Image';
}
async function openFile(file){
  if(busy)return;const turn=++loading;loadBusy=true;render();$('error').hidden=true;status('Opening image…');let next;
  try{
    if(!file?.id||file.kind!=='file')throw Error('Choose an image file.');
    const meta=JSON.parse(file.body||'{}');if(meta.bytes>MAX_BYTES)throw Error('Keep images below 24 MiB.');
    const response=await fetch(ink.files.url(file.id));if(!response.ok)throw Error('The image could not be read.');const blob=await response.blob();if(blob.size>MAX_BYTES)throw Error('Keep images below 24 MiB.');
    next=await createImageBitmap(blob,{imageOrientation:'from-image'});dimensions(next.width,next.height,IDENTITY);
    if(turn!==loading){next.close();return;}bitmap?.close();bitmap=next;source=file;matrix=[...IDENTITY];savedMatrix=[...IDENTITY];undo=[];lastSaved=undefined;$('filename').value=outputName(file.title||file.source);render();
    status(/gif|webp/.test(meta.mime||'')?'Ready · animated images use their first frame':'Ready · choose a flip or rotation');
  }catch(e){if(next!==bitmap)next?.close();if(turn===loading){error(e);status('Could not open this image.');}}finally{if(turn===loading){loadBusy=false;render();}}
}
function transform(operation){if(!bitmap||busy||loadBusy)return;undo.push([...matrix]);matrix=apply(matrix,operation);$('error').hidden=true;render();status(dirty()?'Unsaved edits':'Original orientation');}
for(const id of ['left','right','horizontal','vertical'])$(id).onclick=()=>transform(id);
$('undo').onclick=()=>{if(!undo.length||busy||loadBusy)return;matrix=undo.pop();render();status(dirty()?'Unsaved edits':'Original orientation');};
$('reset').onclick=()=>{if(!bitmap||busy||loadBusy)return;undo.push([...matrix]);matrix=[...IDENTITY];render();status(dirty()?'Unsaved edits':'Original orientation');};
$('open').onclick=async()=>{try{const files=await ink.files.pick({multiple:false});if(files[0])await openFile(files[0]);}catch(e){error(e);}};
$('upload').onclick=()=>$('input').click();
$('input').onchange=async()=>{const file=$('input').files[0];if(!file)return;try{if(file.size>MAX_BYTES)throw Error('Keep images below 24 MiB.');const files=await ink.files.upload([file]);if(files[0])await openFile(files[0]);}catch(e){error(e);}finally{$('input').value='';}};
async function saveCopy(){
  if(!dirty()||busy||loadBusy)return;busy=true;$('error').hidden=true;render();status('Saving PNG to Ink OS…');
  const current=[...matrix];
  try{
    const name=pngName($('filename').value),blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not encode this image.')),'image/png'));
    if(blob.size>MAX_BYTES)throw Error('The PNG exceeds 24 MiB. Resize it in Image Converter first.');
    const files=await ink.files.upload([new File([blob],name,{type:'image/png'})]);if(!files[0])throw Error('The saved image was not returned.');lastSaved=files[0];savedMatrix=current;$('filename').value=name;status('Saved '+name+' in Ink OS');
  }catch(e){error(e);status('Could not confirm the save. Your edits remain here.');}finally{busy=false;render();}
}
$('save').onclick=()=>void saveCopy();$('preview').onclick=()=>lastSaved&&ink.desktop.open(lastSaved.id).catch(error);
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();event.stopImmediatePropagation();void saveCopy();}},{capture:true});
async function fromId(id){if(id&&id!==ink.snapshot.namespace){const file=await ink.world.get(id);if(file.kind==='file')await openFile(file);}}
try{
  ink=await connect();drops=ink.files.acceptDrops(TYPES,files=>{if(files.length>1){error(Error('Drop one image at a time.'));return;}if(files[0])void openFile(files[0]);});await drops.ready;
  ink.on('launch',event=>{const id=event.data?.fileIds?.[0];if(id)void fromId(id).catch(error);});ink.on('context',event=>{const id=event.route?.id;if(id&&id!==source?.id)void fromId(id).catch(error);});
  render();ink.ready();status('Ready · open an image or drop one here');await fromId(ink.route.id);
}catch(e){error(e);status('Could not connect to Ink OS.');}
addEventListener('pagehide',()=>{bitmap?.close();drops?.unsubscribe();});
