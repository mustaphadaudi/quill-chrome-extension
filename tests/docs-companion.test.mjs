import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './docs-fixture.mjs';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const original='Before I has a idea. teh plan. After';
const suggestion=(original,replacement,occurrence=0)=>({original,replacement,occurrence,category:'grammar',explanation:'Fixture correction.'});
test('Docs package syntax, generated engine parity and current-document scopes',()=>{
 execFileSync(process.execPath,['scripts/build-docs-companion.mjs','--check'],{cwd:new URL('../',import.meta.url)});
 for(const name of ['Code.gs','Engine.gs'])new vm.Script(read('docs-companion/'+name));
 const html=read('docs-companion/Sidebar.html');for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 const manifest=JSON.parse(read('docs-companion/appsscript.json'));assert.deepEqual(manifest.oauthScopes,['https://www.googleapis.com/auth/documents.currentonly','https://www.googleapis.com/auth/script.container.ui','https://www.googleapis.com/auth/script.external_request']);assert.equal(manifest.runtimeVersion,'V8');assert.ok(!/innerHTML|eval\(/.test(html));
});
test('selection sends only chosen passage; key uses a header and is never returned',()=>{
 const f=fixture(),result=f.api.docsCheck({scope:'selection',mode:'check'}),sent=JSON.parse(f.calls[0].options.payload);
 assert.equal(JSON.parse(sent.contents[0].parts[0].text).source,'I has a idea. teh plan.');assert.equal(result.text,'I has a idea. teh plan.');assert.equal(result.suggestions.length,3);assert.equal(f.calls[0].options.headers['x-goog-api-key'],'fixture-private-key');assert.ok(!f.calls[0].url.includes('fixture-private-key'));assert.ok(!JSON.stringify(result).includes('fixture-private-key'));assert.equal(f.api.docsSettings().hasKey,true);
});
test('sequential direct edits preserve remaining suggestions, context and unrelated formatting; undo restores exact styles',()=>{
 const f=fixture(),checked=f.api.docsCheck({scope:'selection',mode:'check'}),token=checked.token;
 const first=f.api.docsChange(token,'accept',0);assert.equal(f.node.getText(),'Before I have a idea. teh plan. After');assert.equal(first.suggestions.length,2);assert.equal(first.suggestions[0].start,7);assert.equal(first.canUndo,true);assert.deepEqual(f.node.attributes.slice(0,6),f.initialAttrs.slice(0,6));assert.equal(f.other.getText(),'Untouched paragraph.');
 f.api.docsChange(token,'accept',0);assert.equal(f.node.getText(),'Before I have an idea. teh plan. After');const undone=f.api.docsChange(token,'undo');assert.equal(f.node.getText(),'Before I have a idea. teh plan. After');assert.equal(undone.suggestions.length,2);assert.equal(undone.canUndo,false);
 const dismissed=f.api.docsChange(token,'dismiss',0);assert.equal(dismissed.suggestions.length,1);f.api.docsChange(token,'all');assert.equal(f.node.getText(),'Before I have a idea. the plan. After');assert.equal(f.calls.length,1);
});
test('undo restores original styles for an edited word and deletion',()=>{
 const f=fixture();for(let i=9;i<12;i++)f.node.attributes[i].ITALIC=true;const before=JSON.parse(JSON.stringify(f.node.attributes));f.setResponse({summary:'Fix.',tone:'Neutral',rewrite:'',suggestions:[suggestion('has','have')]});const result=f.api.docsCheck({scope:'selection',mode:'check'});f.api.docsChange(result.token,'all');f.api.docsChange(result.token,'undo');assert.equal(f.node.getText(),original);assert.deepEqual(f.node.attributes,before);
 f.setResponse({summary:'Delete.',tone:'Neutral',rewrite:'',suggestions:[suggestion('teh ','')]});const deletion=f.api.docsCheck({scope:'selection',mode:'check'});f.api.docsChange(deletion.token,'all');assert.equal(f.node.getText(),'Before I has a idea. plan. After');f.api.docsChange(deletion.token,'undo');assert.equal(f.node.getText(),original);assert.deepEqual(f.node.attributes,before);
});
test('changed text, other paragraphs, formatting, document tabs and expired sessions reject writes',()=>{
 for(const mutate of [f=>f.node.value+=' typed',f=>f.other.value+=' edited',f=>f.node.attributes[9].BOLD=true,f=>f.setTab('tab-2'),f=>f.setDoc('different-document'),f=>f.cache.clear()]){const f=fixture(),result=f.api.docsCheck({scope:'selection',mode:'check'});mutate(f);const before=f.node.getText();assert.throws(()=>f.api.docsChange(result.token,'all'),/changed|expired/);assert.equal(f.node.getText(),before);}
 const f=fixture(),result=f.api.docsCheck({scope:'selection',mode:'check'});f.api.docsChange(result.token,'accept',0);f.node.value+=' own writing';assert.throws(()=>f.api.docsChange(result.token,'undo'),/changed/);
});
test('paragraph fallback is explicit; unsupported/missing selections and stale API results cannot write',()=>{
 const f=fixture();f.setScope('multiple');assert.throws(()=>f.api.docsCheck({scope:'selection',mode:'check'}),/one paragraph/);assert.equal(f.calls.length,0);f.setScope('none');assert.throws(()=>f.api.docsCheck({scope:'selection',mode:'check'}),/Select some text/);f.setScope('selection');const paragraph=f.api.docsCheck({scope:'paragraph',mode:'check'});assert.equal(paragraph.text,original);
 const changed=fixture();changed.setFetch(()=>changed.other.value+=' changed during API call');assert.throws(()=>changed.api.docsCheck({scope:'selection',mode:'check'}),/changed/);assert.equal(changed.node.getText(),original);
});
test('rewrites target only the selected passage and reject new paragraphs',()=>{
 const f=fixture();f.setResponse({summary:'Clearer.',tone:'Neutral',suggestions:[],rewrite:'I have an idea.'});const result=f.api.docsCheck({scope:'selection',mode:'clearer'});f.api.docsChange(result.token,'rewrite');assert.equal(f.node.getText(),'Before I have an idea. After');f.api.docsChange(result.token,'undo');assert.equal(f.node.getText(),original);
 f.setResponse({summary:'Bad.',tone:'Neutral',suggestions:[],rewrite:'New\nparagraph'});assert.throws(()=>f.api.docsCheck({scope:'selection',mode:'clearer'}),/paragraph breaks/);assert.equal(f.node.getText(),original);
});
test('provider failures redact secrets, persist quota cooldown and key removal works',()=>{
 const f=fixture();f.api.UrlFetchApp.fetch=()=>({getResponseCode:()=>429,getContentText:()=>JSON.stringify({error:{message:'Quota for fixture-private-key'}})});assert.throws(()=>f.api.docsCheck({scope:'selection',mode:'check'}),error=>error.message.includes('HTTP 429')&&!error.message.includes('fixture-private-key'));assert.ok(Number(f.props.get('quillCooldown'))>Date.now());assert.throws(()=>f.api.docsTestConnection(),/cooling down/);f.api.docsRemoveKey();assert.equal(f.api.docsSettings().hasKey,false);assert.throws(()=>f.api.docsTestConnection(),/Save your Gemini API key/);
});
