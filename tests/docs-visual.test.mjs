import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './docs-fixture.mjs';
const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(new URL('../content/docs/geometry.js',import.meta.url),'utf8'),box);const geometry=box.QuillDocsGeometry;
const run=(text,x=0,y=30)=>({text,x,y,top:y-12,bottom:y+3,width:text.length*10,sx:1,ratioX:1,ratioY:1,canvasLeft:20,canvasTop:40,font:'16px Arial'});
const measure=(r,text)=>text.length*10;
test('Docs geometry maps exact selected offsets across wrapped lines and canvas scaling',()=>{
 const f=fixture(),s=f.api.docsCheck({scope:'selection',mode:'check'});const runs=[run('Before I has a idea.'),run('teh plan. After',0,60)];
 let result=geometry.project(s.anchor,s.suggestions,runs,measure);assert.equal(result.marks.length,3);assert.equal(result.marks[0].left,110);assert.equal(result.marks[0].right,140);assert.equal(result.marks[2].top,88);
 const scaled=runs.map(r=>({...r,sx:2,width:r.width*2,ratioX:.5,ratioY:.5,x:0,y:r.y*2,top:r.top*2,bottom:r.bottom*2}));result=geometry.project(s.anchor,s.suggestions,scaled,measure);assert.equal(result.marks[0].left,110);assert.equal(result.marks[2].top,88);
});
test('Docs geometry rejects stale, duplicate, partial, RTL-unsupported and malformed matches',()=>{
 const f=fixture(),s=f.api.docsCheck({scope:'selection',mode:'check'}),runs=[run(s.anchor.full)];
 assert.equal(geometry.project({...s.anchor,unique:false},s.suggestions,runs,measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,s.suggestions,[run(s.anchor.full),run(s.anchor.full,0,70)],measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,s.suggestions,[run(s.anchor.full.replace('has','have'))],measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,s.suggestions,[run('I has a idea.')],measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,[{...s.suggestions[0],original:'wrong'}],runs,measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,s.suggestions,[{...runs[0],ratioX:NaN}],measure).marks.length,0);
 assert.equal(geometry.project(s.anchor,s.suggestions,[runs[0],runs[0]],measure).marks.length,3);
});
test('Docs companion publishes exact anchor, duplicate guard and explicit live preferences without a key',()=>{
 const f=fixture(),s=f.api.docsCheck({scope:'selection',mode:'check'});assert.equal(s.anchor.start,7);assert.equal(s.anchor.full,f.node.getText());assert.equal(s.anchor.unique,true);assert.equal(s.anchor.docId,'doc-1');
 f.other.value=f.node.getText();assert.equal(f.api.docsCheck({scope:'selection',mode:'check'}).anchor.unique,false);
 f.api.docsRemoveKey();assert.equal(f.api.docsSettings().inlineEnabled,false);f.api.docsSaveInline({enabled:true,live:true});assert.equal(f.api.docsSettings().liveEnabled,true);f.api.docsSaveInline({enabled:false,live:true});assert.equal(f.api.docsSettings().liveEnabled,false);assert.throws(()=>f.api.docsSaveInline({enabled:'yes',live:true}),/Invalid/);
});
test('Docs frame router binds document/frame IDs, forwards only known actions, and survives worker restart',async()=>{
 const memory={},sent=[],previous=globalThis.chrome;globalThis.chrome={runtime:{id:'qa',onMessage:{addListener(){}}},storage:{session:{get:async key=>({[key]:memory[key]}),set:async value=>Object.assign(memory,value)},local:{get:async()=>({settings:{enabled:true}})}},tabs:{sendMessage:async(...args)=>sent.push(args)}};
 try{
  const {routeDocs}=await import('../background/docs-bridge.js?qaVisual');
  const top={tab:{id:10},documentId:'top',frameId:0,url:'https://docs.google.com/document/d/doc-1/edit'},frame={tab:{id:10},documentId:'sidebar',frameId:8,url:'https://qa-script.googleusercontent.com/userCodeAppPanel'};
  await routeDocs({type:'QUILL_DOCS_TOP'},top);const data={nonce:'12345678-1234-1234-1234-123456789012',docId:'doc-1',enabled:true,live:false,session:null};
  await assert.rejects(routeDocs({type:'QUILL_DOCS_PUBLISH',data:{...data,docId:'other'}},frame),/match/);
  await routeDocs({type:'QUILL_DOCS_PUBLISH',data},frame);assert.equal(sent.at(-1)[2].documentId,'top');
  await routeDocs({type:'QUILL_DOCS_ACTION',nonce:data.nonce,action:'accept',index:0,token:data.nonce},top);assert.equal(sent.at(-1)[2].documentId,'sidebar');assert.equal(sent.at(-1)[1].action,'accept');
  await assert.rejects(routeDocs({type:'QUILL_DOCS_ACTION',nonce:data.nonce,action:'accept',index:0},frame),/reconnect/);
  await assert.rejects(routeDocs({type:'QUILL_DOCS_ACTION',nonce:data.nonce,action:'arbitrary-edit'},top),/Unknown/);
  await routeDocs({type:'QUILL_DOCS_TOP'},top);assert.equal(memory['quillDocsRoute:10'].companion,'sidebar');
  await routeDocs({type:'QUILL_DOCS_TOP'},{...top,documentId:'reloaded'});assert.equal(memory['quillDocsRoute:10'].companion,undefined);
 }finally{globalThis.chrome=previous;}
});
