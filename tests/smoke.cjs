const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const project = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(project, 'manifest.json'), 'utf8'));
const referenced = [manifest.background.service_worker, manifest.action.default_popup,
  ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(entry => entry.js),
  ...manifest.web_accessible_resources.flatMap(entry => entry.resources)];
for (const file of referenced) assert.ok(fs.existsSync(path.join(project, file)), `Missing: ${file}`);
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['storage']);
assert.deepEqual(manifest.host_permissions, ['https://generativelanguage.googleapis.com/*']);
const files = fs.readdirSync(project, {recursive: true}).filter(file => !file.startsWith('node_modules') && !file.startsWith('.git') && /\.(js|cjs|mjs)$/.test(file));
for (const file of files) execFileSync(process.execPath, ['--check', path.join(project, file)]);
console.log('PASS: manifest references, minimum permissions and all JavaScript syntax');

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(project, '.' + pathname);
  if (!file.startsWith(project + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/javascript');
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'quill-qa-'));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: true, viewport: {width: 1100, height: 850},
      args: [`--disable-extensions-except=${project}`, `--load-extension=${project}`]
    });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await worker.evaluate(async () => {
      await chrome.storage.local.set({apiKey:'browser-fixture-key'});
      globalThis.fetch = async url => {globalThis.lastModel=url;if(globalThis.fixtureError)return {ok:false,status:404,json:async()=>({error:{status:'NOT_FOUND',message:'Model access disabled for browser-fixture-key'}})};return ({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({summary:'Fix verb agreement.',tone:'Neutral',rewrite:'',suggestions:globalThis.fixtureSuggestions||[{original:'are',replacement:'is',explanation:'Singular subject.',category:'grammar',occurrence:0}]})}]}}]})});};
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/tests/editor-fixture.html`);
    const host = page.locator('[data-quill-widget]');
    await page.locator('#plain').focus();
    await host.waitFor({state: 'visible'});
    assert.equal(await page.locator('#plain').inputValue(), 'This are a test sentence.');
    await host.click();
    await page.screenshot({path: path.join(os.tmpdir(), 'quill-widget-qa.png')});
    console.log('PASS: real extension injected; widget opens; original text unchanged');

    await page.locator('#plain').focus();
    if (!(await host.locator('.check').isVisible())) await host.locator('.indicator').click();
    await host.locator('.check').click();
    await host.locator('.accept').waitFor();
    const ink=page.locator('[data-quill-highlights]');await ink.locator('.mark').waitFor();
    const line=await ink.locator('.mark').first().evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};});assert.ok(line.width>10);
    await page.mouse.move(line.x+line.width/2,line.y-5);await ink.locator('.tip').waitFor({state:'visible'});
    assert.equal(await ink.locator('.tip strong').textContent(),'is');await ink.locator('.tip .accept').click();
    assert.equal(await ink.locator('.mark').count(),0);
    assert.equal(await page.locator('#plain').inputValue(), 'This is a test sentence.');
    await host.locator('.undo').click();
    assert.equal(await page.locator('#plain').inputValue(), 'This are a test sentence.');
    console.log('PASS: red underline, hover correction, accept and undo with mocked Gemini transport');
    await host.locator('.check').click();await ink.locator('.mark').waitFor();
    await ink.locator('.mark').first().focus();await ink.locator('.tip .dismiss').click();assert.equal(await ink.locator('.mark').count(),0);assert.equal(await page.locator('#plain').inputValue(),'This are a test sentence.');
    await host.locator('.auto').check();await page.locator('#plain').fill('This are a live sentence.');await ink.locator('.mark').waitFor();
    await page.locator('#plain').fill('New writing without the old error.');assert.equal(await ink.locator('.mark').count(),0);
    await host.locator('.auto').uncheck();console.log('PASS: dismiss leaves text intact; live checking; stale underlines cleared on typing');
    for (const selector of ['#password', '#email', '#readonly', '#card']) {
      await page.locator(selector).focus();
      await host.waitFor({state: 'hidden'});
    }
    console.log('PASS: passwords, email, read-only and payment autocomplete excluded');
    await page.locator('#add').click();
    await host.waitFor({state: 'visible'});
    console.log('PASS: dynamically created textarea supported');
    await page.locator('#rich').focus();await host.waitFor({state:'visible'});
    if(!(await host.locator('.check').isVisible()))await host.locator('.indicator').click();
    await host.locator('.check').click();await host.locator('.accept').waitFor();await ink.locator('.mark').waitFor();
    const richLine=await ink.locator('.mark').first().boundingBox();const word=await page.locator('#rich').evaluate(el=>{const r=document.createRange();r.setStart(el.firstChild.firstChild,5);r.setEnd(el.firstChild.firstChild,8);const b=r.getBoundingClientRect();return {x:b.x,width:b.width};});assert.ok(Math.abs(richLine.x-word.x)<2);assert.ok(Math.abs(richLine.width-word.width)<2);
    await ink.locator('.mark').first().focus();await ink.locator('.tip .accept').click();
    assert.equal(await page.locator('#rich').innerText(),'This is a test sentence.\nSecond paragraph.');
    assert.equal(await page.locator('#rich strong').textContent(),'test');
    await host.locator('.undo').click();assert.equal(await page.locator('#rich strong').textContent(),'test');assert.ok((await page.locator('#rich').innerText()).startsWith('This are'));
    await page.locator('#shadow-rich').focus();await host.waitFor({state:'visible'});
    if(!(await host.locator('.check').isVisible()))await host.locator('.indicator').click();
    await host.locator('.check').click();await host.locator('.accept').waitFor();await host.locator('.accept').click();
    assert.equal(await page.locator('#shadow-rich').innerText(),'This is a shadow test sentence.');
    await page.locator('#search').focus();await host.waitFor({state:'visible'});
    const framed=page.frameLocator('#frame');await framed.locator('#embedded').focus();
    await framed.locator('[data-quill-widget]').waitFor({state:'visible'});
    console.log('PASS: rich text with formatting and undo, shadow-root editor, search input and iframe');
    const pad=await context.newPage();await pad.goto(`chrome-extension://${id}/workbench/workbench.html`);
    await pad.locator('#source').fill('This are a pad test sentence.');await pad.locator('#check').click();await pad.locator('[data-quill-highlights] .mark').first().focus();await pad.locator('[data-quill-highlights] .tip .accept').click();
    assert.equal(await pad.locator('#source').inputValue(),'This is a pad test sentence.');await pad.locator('#undo').click();assert.equal(await pad.locator('#source').inputValue(),'This are a pad test sentence.');await worker.evaluate(()=>globalThis.fixtureSuggestions=[{original:'has',replacement:'have',explanation:'Agreement.',category:'grammar',occurrence:0},{original:'a ',replacement:'an ',explanation:'Article.',category:'grammar',occurrence:0},{original:'teh',replacement:'the',explanation:'Spelling.',category:'spelling',occurrence:0}]);
    await pad.locator('#source').fill('I has a idea. teh plan.');await pad.locator('#check').click();await pad.locator('#results article').nth(2).waitFor();
    await pad.locator('#results article button').first().click();assert.equal(await pad.locator('#source').inputValue(),'I have a idea. teh plan.');assert.equal(await pad.locator('#results article').count(),2);assert.equal(await pad.locator('[data-quill-highlights] .mark').count(),2);
    await pad.locator('#results article button').first().click();assert.equal(await pad.locator('#source').inputValue(),'I have an idea. teh plan.');assert.equal(await pad.locator('#results article').count(),1);
    await pad.locator('#undo').click();assert.equal(await pad.locator('#source').inputValue(),'I have a idea. teh plan.');assert.equal(await pad.locator('#results article').count(),2);
    await pad.locator('#results article').first().getByText('Dismiss',{exact:true}).click();await pad.locator('#results').getByText('Apply all suggestions',{exact:true}).click();assert.equal(await pad.locator('#source').inputValue(),'I have a idea. the plan.');
    await page.locator('#plain').fill('I has a idea. teh plan.');if(!(await host.locator('.check').isVisible()))await host.locator('.indicator').click();await host.locator('.check').click();await host.locator('.accept').nth(2).waitFor();await host.locator('.accept').first().click();assert.equal(await page.locator('#plain').inputValue(),'I have a idea. teh plan.');assert.equal(await host.locator('.accept').count(),2);await host.locator('.apply-all').click();assert.equal(await page.locator('#plain').inputValue(),'I have an idea. the plan.');
    await worker.evaluate(()=>delete globalThis.fixtureSuggestions);await pad.close();console.log('PASS: suggestions survive sequential accept, offset changes and undo; dismissed suggestions stay excluded; no recheck required in pad or website fields');
    const options=await context.newPage();await options.goto(`chrome-extension://${id}/options/options.html`);await options.locator('#save:not([disabled])').waitFor();await options.locator('#recommended').click();await options.locator('#test').click();await options.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Connected:'));assert.ok((await worker.evaluate(()=>globalThis.lastModel)).includes('gemini-3.5-flash-lite'));
    await options.locator('#model').fill('gemini-3.8-flash');await worker.evaluate(()=>globalThis.fixtureError=true);await options.locator('#test').click();await options.waitForFunction(()=>document.querySelector('#status').textContent.includes('HTTP 404'));const failure=await options.locator('#status').textContent();assert.ok(failure.includes('NOT_FOUND'));assert.ok(failure.includes('gemini-3.8-flash'));assert.ok(!failure.includes('browser-fixture-key'));await worker.evaluate(()=>globalThis.fixtureError=false);await options.close();console.log('PASS: save-and-test uses selected model; provider diagnostics redact saved key');
    const {fixture}=await import('./docs-fixture.mjs');const docsBackend=fixture();docsBackend.api.docsRemoveKey();
    const sidebar=await context.newPage();sidebar.on('pageerror',error=>errors.push(error.message));
    await sidebar.exposeFunction('quillTestRPC',(name,args)=>{if(!['docsSettings','docsSaveSettings','docsTestConnection','docsTestDocument','docsRemoveKey','docsCheck','docsChange','docsForget'].includes(name))throw new Error('Unknown fixture RPC');return docsBackend.api[name](...args);});
    await sidebar.addInitScript(()=>{
      function runner(success=()=>{},failure=()=>{}){return new Proxy({}, {get(target,name){if(name==='withSuccessHandler')return fn=>runner(fn,failure);if(name==='withFailureHandler')return fn=>runner(success,fn);return async(...args)=>{try{success(await window.quillTestRPC(name,args));}catch(error){failure({message:error.message});}};}});}
      window.google={script:{run:runner()}};
    });
    await sidebar.goto(`http://127.0.0.1:${server.address().port}/docs-companion/Sidebar.html`);
    await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.includes('save your key'));assert.equal(await sidebar.locator('#settings').evaluate(el=>el.open),true);
    await sidebar.locator('#documentTest').click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.includes('Document access passed'));assert.equal(docsBackend.calls.length,0);assert.equal(await sidebar.locator('#version').textContent(),'Quill Docs 0.1.1');
    const readAttrs=docsBackend.node.getAttributes.bind(docsBackend.node);let reversed=false;docsBackend.node.getAttributes=index=>Object.fromEntries(reversed?Object.entries(readAttrs(index)).reverse():Object.entries(readAttrs(index)));docsBackend.setFetch(()=>{reversed=!reversed;});
    await sidebar.locator('#key').fill('sidebar-fixture-key');await sidebar.locator('#test').click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Connected.'));assert.equal(await sidebar.locator('#key').inputValue(),'');
    await sidebar.locator('#selection').click();await sidebar.locator('#results article').nth(2).waitFor();assert.equal(await sidebar.locator('#passage').inputValue(),'I has a idea. teh plan.');
    await sidebar.locator('#results article').first().getByRole('button',{name:'Accept',exact:true}).click();await sidebar.waitForFunction(()=>document.querySelector('#count').textContent==='2 remaining suggestions');assert.equal(docsBackend.node.getText(),'Before I have a idea. teh plan. After');
    await sidebar.locator('#undo').click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Undone.'));assert.equal(docsBackend.node.getText(),'Before I has a idea. teh plan. After');
    await sidebar.locator('#results article').nth(1).getByRole('button',{name:'Dismiss',exact:true}).click();await sidebar.waitForFunction(()=>document.querySelector('#count').textContent==='2 remaining suggestions');await sidebar.getByRole('button',{name:'Apply all in Docs',exact:true}).click();await sidebar.waitForFunction(()=>document.querySelector('#count').textContent==='0 remaining suggestions');assert.equal(docsBackend.node.getText(),'Before I have a idea. the plan. After');
    await sidebar.locator('#undo').click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Undone.'));docsBackend.other.value+=' manual change';await sidebar.locator('#results article').first().getByRole('button',{name:'Accept',exact:true}).click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent.includes('changed'));assert.equal(await sidebar.locator('#checked').isVisible(),false);assert.equal(docsBackend.node.getText(),'Before I has a idea. teh plan. After');
    await sidebar.locator('#settings').evaluate(el=>el.open=true);await sidebar.locator('#remove').click();await sidebar.waitForFunction(()=>document.querySelector('#status').textContent==='Saved key removed.');assert.equal(await sidebar.locator('#remove').isDisabled(),true);await sidebar.close();
    console.log('PASS: native Docs sidebar UI with actual companion backend and mocked Google APIs: no-key document diagnostics, reordered attributes, key setup, direct edits, remaining suggestions, dismiss/apply-all, formatted undo and stale rejection');
    const docs=await context.newPage();await docs.route('https://docs.google.com/document/d/quill-fixture/edit',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Docs canvas fixture</title><canvas width="500" height="200"></canvas>'}));
    await docs.goto('https://docs.google.com/document/d/quill-fixture/edit');await docs.locator('[data-quill-widget]').waitFor({state:'visible'});await docs.locator('[data-quill-widget] .indicator').click();await docs.locator('[data-quill-widget] .pad').waitFor({state:'visible'});assert.equal(await docs.locator('[data-quill-widget] .check').isDisabled(),true);await docs.close();
    console.log('PASS: writing pad checks and undo; persistent Docs button without a text input');
    await page.locator('#draft').focus();

    const popup = await context.newPage();
    popup.on('pageerror', error => errors.push(error.message));
    await popup.goto(`chrome-extension://${id}/popup/popup.html`);
    await popup.locator('#enabled:not([disabled])').waitFor();
    await popup.locator('#enabled').uncheck();
    await popup.waitForFunction(() => document.querySelector('#status').textContent === 'Quill is paused.');
    await host.waitFor({state: 'hidden'});
    await popup.reload();
    await popup.locator('#enabled:not([disabled])').waitFor();
    assert.equal(await popup.locator('#enabled').isChecked(), false);
    await popup.locator('#enabled').check();
    await popup.waitForFunction(() => !document.querySelector('#enabled').disabled);
    await page.locator('#draft').focus();
    await host.waitFor({state: 'visible'});
    await page.locator('#draft').press('Escape');
    await host.waitFor({state: 'hidden'});
    await page.locator('#plain').focus();
    await host.waitFor({state: 'visible'});
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await host.waitFor({state: 'hidden'});
    console.log('PASS: toggle updates live, preference persists, Escape and off-screen hiding');
    const level = await worker.evaluate(async () => {
      await chrome.storage.local.set({qaSecret: 'test-only'});
      return chrome.storage.local.get('qaSecret');
    });
    assert.equal(level.qaSecret, 'test-only');
    // Run in the existing isolated content-script world, rather than website JS.
    const cdp = await context.newCDPSession(page);
    const worlds = [];
    cdp.on('Runtime.executionContextCreated', event => worlds.push(event.context));
    await cdp.send('Runtime.enable');
    const isolated = worlds.find(world => world.name === id || world.name === manifest.name);
    assert.ok(isolated, 'Extension isolated world exists');
    const access = await cdp.send('Runtime.evaluate', {
      contextId: isolated.id, awaitPromise: true, returnByValue: true,
      expression: '(async () => {try {await chrome.storage.local.get("qaSecret"); return "allowed"} catch {return "blocked"}})()'
    });
    assert.equal(access.result.value, 'blocked');
    const response = await cdp.send('Runtime.evaluate', {
      contextId: isolated.id, awaitPromise: true, returnByValue: true,
      expression: 'chrome.runtime.sendMessage({type:"QUILL_GET_STATUS"})'
    });
    assert.deepEqual(Object.keys(response.result.value.settings).sort(), ['autoCheck','enabled']);
    assert.equal(response.result.value.apiKey, undefined);
    console.log('PASS: content script cannot read raw storage; messages expose only enabled flag');
    await worker.evaluate(() => chrome.storage.local.remove('qaSecret'));
    assert.deepEqual(errors, []);
    console.log('PASS: no popup or fixture runtime errors');
    console.log('Screenshot: ' + path.join(os.tmpdir(), 'quill-widget-qa.png'));
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(profile, {recursive: true, force: true});
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
