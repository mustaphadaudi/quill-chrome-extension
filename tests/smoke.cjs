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
      globalThis.fetch = async () => ({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({summary:'Fix verb agreement.',tone:'Neutral',rewrite:'',suggestions:[{original:'are',replacement:'is',explanation:'Singular subject.',category:'grammar',occurrence:0}]})}]}}]})});
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
    await host.locator('.accept').click();
    assert.equal(await page.locator('#plain').inputValue(), 'This is a test sentence.');
    await host.locator('.undo').click();
    assert.equal(await page.locator('#plain').inputValue(), 'This are a test sentence.');
    console.log('PASS: correction and undo with mocked Gemini transport');
    for (const selector of ['#password', '#email', '#readonly', '#card']) {
      await page.locator(selector).focus();
      await host.waitFor({state: 'hidden'});
    }
    console.log('PASS: passwords, email, read-only and payment autocomplete excluded');
    await page.locator('#add').click();
    await host.waitFor({state: 'visible'});
    console.log('PASS: dynamically created textarea supported');
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
    assert.deepEqual(Object.keys(response.result.value.settings), ['enabled']);
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
