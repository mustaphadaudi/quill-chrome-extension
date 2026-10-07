import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {generate,validateRequest,validateResult,applyEdits,MAX_TEXT} from '../background/gemini.js';
const project=fileURLToPath(new URL('../',import.meta.url));
const source='I has a idea. I has plans.';
const response={summary:'Two grammar edits.',tone:'Neutral',rewrite:'',suggestions:[0,1].map(occurrence=>({original:'has',replacement:'have',explanation:'Subject agreement.',category:'grammar',occurrence}))};
const settings={model:'gemini-2.5-flash-lite',language:'en-GB'};
const success=body=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(body)}]}}]})});
test('manifest references and all JavaScript syntax',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(project,'manifest.json')));assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage']);assert.deepEqual(m.host_permissions,['https://generativelanguage.googleapis.com/*']);
 const refs=[m.background.service_worker,m.action.default_popup,m.options_ui.page,...Object.values(m.icons),...m.content_scripts.flatMap(x=>x.js),...m.web_accessible_resources.flatMap(x=>x.resources)];for(const name of refs)assert.ok(fs.existsSync(path.join(project,name)),name);
 for(const file of fs.readdirSync(project,{recursive:true}).filter(x=>!x.startsWith('.git')&&!x.startsWith('node_modules')&&/\.(js|cjs|mjs)$/.test(x)))execFileSync(process.execPath,['--check',path.join(project,file)]);
 for(const name of [m.action.default_popup,m.options_ui.page]){const html=fs.readFileSync(path.join(project,name),'utf8');assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(html));for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^https?:/.test(match[1]))continue;assert.ok(fs.existsSync(path.resolve(project,path.dirname(name),match[1])),match[1]);}}
});
test('request limits, occurrence mapping, safe edits, rewrites and malformed suggestions',()=>{
 assert.throws(()=>validateRequest('', 'check'));assert.throws(()=>validateRequest('a'.repeat(MAX_TEXT+1),'check'),/Nothing was truncated/);assert.throws(()=>validateRequest('Hi','unknown'));
 const result=validateResult(response,source,'check');assert.equal(result.suggestions[1].start,16);assert.equal(applyEdits(source,result.suggestions),'I have a idea. I have plans.');
 assert.throws(()=>validateResult({...response,suggestions:[{...response.suggestions[0],original:'missing'}]},source,'check'),/did not match/);assert.throws(()=>validateResult({...response,suggestions:[response.suggestions[0],response.suggestions[0]]},source,'check'),/overlapping/);assert.throws(()=>applyEdits('Changed text',result.suggestions),/text changed/);
 assert.equal(validateResult({...response,rewrite:'I have an idea.'},source,'professional').rewrite,'I have an idea.');assert.throws(()=>validateResult({...response,rewrite:''},source,'friendly'),/invalid rewrite/);
 const deletion=validateResult({...response,suggestions:[{...response.suggestions[0],original:' a',replacement:'',occurrence:0}]},source,'check');assert.equal(applyEdits(source,deletion.suggestions),'I has idea. I has plans.');
});
test('REST request uses key header and structured JSON',async()=>{
 let request;const result=await generate({text:source,mode:'check',settings,apiKey:'fixture-key',fetcher:async(url,options)=>{request={url,options};return success(response);}});assert.ok(!request.url.includes('fixture-key'));assert.equal(request.options.headers['x-goog-api-key'],'fixture-key');const body=JSON.parse(request.options.body);assert.equal(JSON.parse(body.contents[0].parts[0].text).source,source);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.equal(result.suggestions.length,2);
});
test('quota, denied access, model, network and truncated response errors',async()=>{
 for(const [status,pattern] of [[429,/quota/],[403,/rejected/],[404,/unavailable/],[503,/temporarily/]])await assert.rejects(generate({text:source,mode:'check',settings,apiKey:'fixture-key',fetcher:async()=>({ok:false,status})}),pattern);
 await assert.rejects(generate({text:source,mode:'check',settings,apiKey:'fixture-key',fetcher:async()=>{throw Error('network');}}),/could not be reached/);
 await assert.rejects(generate({text:source,mode:'check',settings,apiKey:'fixture-key',fetcher:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS'}]})})}),/did not finish/);
});
test('background hides key, caches results, rejects foreign sender and persists cooldown',async()=>{
 const local={apiKey:'fixture-key',settings:{enabled:true}},session={};let listener,calls=0,accessLevel;const area=data=>({get:async key=>({[key]:data[key]}),set:async values=>Object.assign(data,values)});
 globalThis.chrome={runtime:{id:'test-extension',onMessage:{addListener:fn=>listener=fn},openOptionsPage:async()=>{}},storage:{local:{...area(local),setAccessLevel:async value=>accessLevel=value},session:area(session),onChanged:{addListener(){}}}};
 const old=globalThis.fetch;globalThis.fetch=async()=>{calls++;return success(response);};
 try{await import('../background/service-worker.js?qa');const send=message=>new Promise(resolve=>listener(message,{id:'test-extension',tab:{id:1},url:'https://example.com'},resolve));
 const status=await send({type:'QUILL_GET_STATUS'});assert.deepEqual(status.settings,{enabled:true,autoCheck:false});assert.equal(status.apiKey,undefined);assert.equal(accessLevel.accessLevel,'TRUSTED_CONTEXTS');assert.equal((await send({type:'QUILL_ANALYZE',text:source,mode:'check'})).ok,true);assert.equal((await send({type:'QUILL_ANALYZE',text:source,mode:'check'})).cached,true);assert.equal(calls,1);
 globalThis.fetch=async()=>({ok:false,status:429});assert.equal((await send({type:'QUILL_ANALYZE',text:'Other passage',mode:'check'})).ok,false);assert.ok(session.cooldownUntil>Date.now());assert.match((await send({type:'QUILL_ANALYZE',text:'Third passage',mode:'check'})).error,/cooling down/);assert.equal(listener({type:'QUILL_GET_STATUS'},{id:'foreign'},()=>{}),false);
 }finally{globalThis.fetch=old;delete globalThis.chrome;}
});
test('editor selection replacement, undo, stale-result guard and password exclusion',async()=>{
 const events={};let handlers,applier,pending;
 class Element{constructor(){this.disabled=false;this.readOnly=false;this.isConnected=true;this.autocomplete='';}closest(){return null;}getBoundingClientRect(){return {top:0,left:0,right:400,bottom:100,width:400,height:100};}dispatchEvent(){}}
 class Input extends Element{constructor(){super();this.type='text';this._value='';}get value(){return this._value;}set value(v){this._value=v;}}
 class Textarea extends Input{get value(){return this._value;}set value(v){this._value=v;}}
 const widget={bind:x=>handlers=x,reset(){},loading(){},message(){},open(){},hide(){},show(){},undoAvailable(){},owns:()=>false,result:(r,fn)=>applier=fn};
 const sandbox={HTMLElement:Element,HTMLInputElement:Input,HTMLTextAreaElement:Textarea,QuillWidget:widget,ResizeObserver:class{observe(){}disconnect(){}},InputEvent:class{},Event:class{},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,window:{addEventListener(){}},document:{activeElement:null,addEventListener:(name,fn)=>events[name]=fn},chrome:{storage:{onChanged:{addListener(){}}},runtime:{onMessage:{addListener(){}},sendMessage:async message=>message.type==='QUILL_GET_STATUS'?{ok:true,settings:{enabled:true,autoCheck:false}}:pending?await pending:{ok:true,result:validateResult(response,source,'check')}}}};
 vm.runInNewContext(fs.readFileSync(path.join(project,'content/editor.js'),'utf8'),sandbox);const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();
 const field=new Textarea();field.value='Before '+source+' After';field.selectionStart=7;field.selectionEnd=7+source.length;events.focusin({target:field});await flush();await handlers.run('check');applier({suggestions:validateResult(response,source,'check').suggestions});assert.equal(field.value,'Before I have a idea. I have plans. After');handlers.undo();assert.equal(field.value,'Before '+source+' After');
 await handlers.run('check');field.value='I typed more';applier({suggestions:validateResult(response,source,'check').suggestions});assert.equal(field.value,'I typed more');let resolve;pending=new Promise(r=>resolve=r);const request=handlers.run('check');events.input({target:field});applier=null;resolve({ok:true,result:response});await request;assert.equal(applier,null);const password=new Input();password.type='password';events.focusin({target:password});await flush();pending=null;await handlers.run('check');assert.equal(applier,null);
});
