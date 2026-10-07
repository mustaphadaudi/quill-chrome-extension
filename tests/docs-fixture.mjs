import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const original='Before I has a idea. teh plan. After';
const suggestion=(original,replacement,occurrence=0)=>({original,replacement,occurrence,category:'grammar',explanation:'Fixture correction.'});
export function fixture(){
 class Container{
  constructor(type,children=[]){this.type=type;this.children=children;children.forEach(child=>child.parent=this);}
  getType(){return this.type;}getParent(){return this.parent;}getNumChildren(){return this.children.length;}getChild(i){return this.children[i];}getChildIndex(child){return this.children.indexOf(child);}getText(){return this.children.map(child=>child.getText()).join(this.type==='BODY_SECTION'?'\n':'');}
 }
 class Text{
  constructor(value){this.value=value;this.attributes=Array.from(value,()=>({BOLD:false,ITALIC:false,FONT_FAMILY:'Arial',FONT_SIZE:11,LINK_URL:null,TEXT_ALIGNMENT:'NORMAL'}));this.parent=null;}
  getType(){return 'TEXT';}getParent(){return this.parent;}asText(){return this;}getText(){return this.value;}
  getAttributes(i){return {...this.attributes[i]};}
  getTextAttributeIndices(){return this.attributes.map((value,i)=>!i||JSON.stringify(value)!==JSON.stringify(this.attributes[i-1])?i:null).filter(i=>i!==null);}
  deleteText(start,end){this.value=this.value.slice(0,start)+this.value.slice(end+1);this.attributes.splice(start,end-start+1);return this;}
  insertText(start,value){this.value=this.value.slice(0,start)+value+this.value.slice(start);this.attributes.splice(start,0,...Array.from(value,()=>({...this.attributes[Math.min(start,this.attributes.length-1)]})));return this;}
  setAttributes(start,end,attrs){for(let i=start;i<=end;i++)this.attributes[i]={...this.attributes[i],...attrs};return this;}
 }
 const node=new Text(original),other=new Text('Untouched paragraph.'),body=new Container('BODY_SECTION',[new Container('PARAGRAPH',[node]),new Container('PARAGRAPH',[other])]);
 for(let i=0;i<6;i++)node.attributes[i].BOLD=true;
 const initialAttrs=JSON.parse(JSON.stringify(node.attributes));const cache=new Map(),props=new Map(),calls=[];
 let scope='selection',tabId='tab-1',docId='doc-1',response={summary:'Three fixes.',tone:'Neutral',rewrite:'',suggestions:[suggestion('has','have'),suggestion('a ','an '),suggestion('teh','the')]},onFetch=()=>{};
 const tab={getId:()=>tabId,asDocumentTab:()=>({getBody:()=>body})};
 const doc={getId:()=>docId,getActiveTab:()=>tab,getSelection:()=>scope==='none'?null:{getRangeElements:()=>scope==='multiple'?[range,range]:[range]},getCursor:()=>scope==='none'?null:{getElement:()=>node}};
 const range={getElement:()=>node,isPartial:()=>true,getStartOffset:()=>7,getEndOffsetInclusive:()=>original.length-7};
 const area={getProperty:key=>props.get(key)||null,setProperty:(key,value)=>props.set(key,value),setProperties:values=>Object.entries(values).forEach(([key,value])=>props.set(key,value)),deleteProperty:key=>props.delete(key)};
 const cacheApi={put:(key,value)=>cache.set(key,value),get:key=>cache.get(key)||null,remove:key=>cache.delete(key)};
 const lock=()=>({tryLock:()=>true,releaseLock(){}});
 const sandbox={console,Date,PropertiesService:{getUserProperties:()=>area},CacheService:{getUserCache:()=>cacheApi},LockService:{getUserLock:lock,getDocumentLock:lock},DocumentApp:{getActiveDocument:()=>doc,ElementType:{TEXT:'TEXT',PARAGRAPH:'PARAGRAPH',LIST_ITEM:'LIST_ITEM',BODY_SECTION:'BODY_SECTION'},TextAlignment:{NORMAL:'NORMAL'}},Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(algo,text)=>Array.from(crypto.createHash('sha256').update(text).digest()),base64Encode:bytes=>Buffer.from(bytes).toString('base64'),newBlob:text=>({getBytes:()=>Array.from(Buffer.from(text))})},UrlFetchApp:{fetch:(url,options)=>{calls.push({url,options});onFetch();const source=JSON.parse(JSON.parse(options.payload).contents[0].parts[0].text).source;const generated=source==='This are a test sentence.'?{summary:'Fix agreement.',tone:'Neutral',rewrite:'',suggestions:[suggestion('are','is')]}:response;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(generated)}]}}]})};}}};
 vm.createContext(sandbox);vm.runInContext(read('docs-companion/Engine.gs'),sandbox);vm.runInContext(read('docs-companion/Code.gs'),sandbox);
 sandbox.docsSaveSettings({key:'fixture-private-key',model:'gemini-3.5-flash-lite',language:'en-GB'});
 return {api:sandbox,node,other,body,cache,props,calls,initialAttrs,setScope:value=>scope=value,setTab:value=>tabId=value,setDoc:value=>docId=value,setResponse:value=>response=value,setFetch:fn=>onFetch=fn,Text};
}
