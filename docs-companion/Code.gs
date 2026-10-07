/** @OnlyCurrentDoc */
const QUILL_DOCS = {version:'0.1.1', model:'gemini-3.5-flash-lite', ttl:1800, maxNode:24000};
function onOpen(){DocumentApp.getUi().createMenu('Quill').addItem('Open writing assistant','showQuill').addToUi();}
function showQuill(){DocumentApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Quill · personal writing assistant'));}
function docsSettings(){
  const props=PropertiesService.getUserProperties();
  return {hasKey:!!props.getProperty('quillKey'),model:props.getProperty('quillModel')||QUILL_DOCS.model,language:props.getProperty('quillLanguage')||'en-GB',version:QUILL_DOCS.version};
}
function docsSaveSettings(input){
  if(!input||!/^gemini-[a-z0-9.-]+$/.test(input.model)||!['en-GB','en-US'].includes(input.language))throw new Error('Enter a valid model and English variant.');
  const key=typeof input.key==='string'?input.key.trim():'';if(key&&/\s/.test(key))throw new Error('The key must not contain spaces.');
  const props=PropertiesService.getUserProperties();props.setProperties({quillModel:input.model,quillLanguage:input.language});if(key)props.setProperty('quillKey',key);
  return docsSettings();
}
function docsRemoveKey(){PropertiesService.getUserProperties().deleteProperty('quillKey');return docsSettings();}
function docsTestDocument(){
  const doc=DocumentApp.getActiveDocument(),scope=doc.getSelection()?'selection':'paragraph';
  const snap=docsCapture_(scope);docsLocate_(snap);
  return {message:'Quill Docs '+QUILL_DOCS.version+' · Document access passed. The '+scope+' and its formatting can be read consistently. No text changed and no Gemini request was made.'};
}
function docsTestConnection(){docsGenerate_('This are a test sentence.','check');return {message:'Connected. Your saved key and model checked a sample sentence.'};}
function docsCheck(input){
  if(!input||!MODES.includes(input.mode)||!['selection','paragraph'].includes(input.scope))throw new Error('Unknown writing action.');
  const lock=LockService.getUserLock();if(!lock.tryLock(1000))throw new Error('Another Quill action is running. Please wait.');
  try{
    const snap=docsCapture_(input.scope);validateRequest(snap.text,input.mode);
    docsLocate_(snap);const result=docsGenerate_(snap.text,input.mode);docsLocate_(snap);
    if(result.rewrite&&/[\r\n]/.test(result.rewrite))throw new Error('This rewrite adds paragraph breaks. Use the writing pad for multi-paragraph rewrites.');
    if(result.suggestions.some(edit=>/[\r\n]/.test(edit.replacement)))throw new Error('A suggestion adds paragraph breaks. Check a smaller passage.');
    const session={snap,result,remaining:result.suggestions,undo:null};const token=Utilities.getUuid();docsStore_(token,session);
    return docsPublic_(token,session);
  }finally{lock.releaseLock();}
}
function docsChange(token,action,id){
  const lock=LockService.getUserLock();if(!lock.tryLock(1000))throw new Error('Another Quill action is running. Please wait.');
  try{
    const session=docsLoad_(token);
    if(action==='dismiss'){
      if(!Number.isInteger(id)||!session.remaining[id])throw new Error('This suggestion is no longer available.');
      docsLocate_(session.snap);session.remaining.splice(id,1);docsStore_(token,session);return docsPublic_(token,session);
    }
    if(action==='undo'){docsUndo_(session);docsStore_(token,session);return docsPublic_(token,session);}
    let edits;
    if(action==='accept'){if(!Number.isInteger(id)||!session.remaining[id])throw new Error('This suggestion is no longer available.');edits=[session.remaining[id]];}
    else if(action==='all')edits=[...session.remaining];
    else if(action==='rewrite'&&session.result.rewrite)edits=[{start:0,end:session.snap.text.length,original:session.snap.text,replacement:session.result.rewrite}];
    else throw new Error('Unknown edit.');
    if(!edits.length)throw new Error('There are no remaining suggestions.');
    docsApply_(session,edits,action==='rewrite');docsStore_(token,session);return docsPublic_(token,session);
  }finally{lock.releaseLock();}
}
function docsForget(token){if(typeof token==='string'&&/^[a-z0-9-]{36}$/i.test(token))CacheService.getUserCache().remove('quill:'+token);return {ok:true};}
function docsCapture_(scope){
  const doc=DocumentApp.getActiveDocument(),tab=doc.getActiveTab(),body=tab.asDocumentTab().getBody();
  let node,start,end;
  if(scope==='selection'){
    const selection=doc.getSelection();if(!selection)throw new Error('Select some text in one paragraph, then click Check selection.');
    const elements=selection.getRangeElements();
    if(elements.length!==1||elements[0].getElement().getType()!==DocumentApp.ElementType.TEXT)throw new Error('For this first version, select text within one paragraph. Multi-paragraph selections are not supported yet.');
    const range=elements[0];node=range.getElement().asText();start=range.isPartial()?range.getStartOffset():0;end=range.isPartial()?range.getEndOffsetInclusive()+1:node.getText().length;
  }else{
    const cursor=doc.getCursor();if(!cursor)throw new Error('Click inside a paragraph in Docs, then click Check paragraph.');
    let paragraph=cursor.getElement();while(paragraph&&![DocumentApp.ElementType.PARAGRAPH,DocumentApp.ElementType.LIST_ITEM].includes(paragraph.getType()))paragraph=paragraph.getParent();
    if(!paragraph)throw new Error('Choose a normal paragraph or list item.');
    const texts=[];for(let i=0;i<paragraph.getNumChildren();i++){const child=paragraph.getChild(i);if(child.getType()===DocumentApp.ElementType.TEXT)texts.push(child.asText());}
    if(texts.length!==1)throw new Error('This paragraph has a complex structure. Select a smaller text passage instead.');
    node=texts[0];start=0;end=node.getText().length;
  }
  const full=node.getText();if(full.length>QUILL_DOCS.maxNode)throw new Error('This paragraph is too large. Split it into smaller paragraphs first.');
  // Capture formatting through the same body path used during application.
  // A selection's Text wrapper need not serialize attributes identically.
  const path=docsPath_(node,body),canonical=docsTextAt_(body,path,full);
  const snap={docId:doc.getId(),tabId:tab.getId(),path,full,start,end,text:full.slice(start,end),hash:docsHash_(body.getText()),formatHash:docsFormatHash_(canonical)};
  validateRequest(snap.text,'check');return snap;
}
function docsPath_(node,body){
  const path=[];let current=node;
  while(current&&current.getType()!==DocumentApp.ElementType.BODY_SECTION){const parent=current.getParent();if(!parent||typeof parent.getChildIndex!=='function')throw new Error('Select text in the main document body. Headers and footnotes are not supported.');path.unshift(parent.getChildIndex(current));current=parent;}
  if(!current||current.getText()!==body.getText())throw new Error('This passage is outside the active document body.');return path;
}
function docsLocate_(snap){
  const doc=DocumentApp.getActiveDocument();if(doc.getId()!==snap.docId||doc.getActiveTab().getId()!==snap.tabId)throw new Error('The document or active tab changed. Return to the checked tab and check again.');
  const body=doc.getActiveTab().asDocumentTab().getBody();
  if(docsHash_(body.getText())!==snap.hash)throw new Error('Document text changed since the check. Check again before applying.');
  const node=docsTextAt_(body,snap.path,snap.full);
  if(snap.formatHash!==docsFormatHash_(node))throw new Error('Passage formatting changed. Check again before applying.');
  return {node,body};
}
function docsTextAt_(body,path,full){
  let node=body;for(const index of path){if(typeof node.getNumChildren!=='function'||index<0||index>=node.getNumChildren())throw new Error('The passage moved. Check again.');node=node.getChild(index);}
  if(node.getType()!==DocumentApp.ElementType.TEXT||node.asText().getText()!==full)throw new Error('The passage changed or moved. Check again.');return node.asText();
}
function docsHash_(text){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8));}
function docsAttrs_(attrs){
  const copy={};for(const key of Object.keys(attrs).sort()){const value=attrs[key];if(key==='TEXT_ALIGNMENT'&&value!=null)copy[key]=String(value);else if(value==null||['string','number','boolean'].includes(typeof value))copy[key]=value;}
  return copy;
}
function docsRestoreAttrs_(attrs){const copy={...attrs};if(copy.TEXT_ALIGNMENT!=null)copy.TEXT_ALIGNMENT=DocumentApp.TextAlignment[copy.TEXT_ALIGNMENT];return copy;}
function docsFormatHash_(node){const full=node.getText();return docsHash_(JSON.stringify(full.length?docsRuns_(node,0,full.length):[]));}
function docsRuns_(node,start,end){
  if(end<=start)return [];
  const indices=[start,...new Set(node.getTextAttributeIndices().filter(i=>i>start&&i<end))].sort((a,b)=>a-b),runs=[];
  // Extra boundaries between identical styles are not formatting changes.
  for(let i=0;i<indices.length;i++){
    const index=indices[i],attrs=docsAttrs_(node.getAttributes(index)),last=runs[runs.length-1],runEnd=(indices[i+1]??end)-start;
    if(last&&JSON.stringify(last.attrs)===JSON.stringify(attrs))last.end=runEnd;
    else runs.push({start:index-start,end:runEnd,attrs});
  }
  return runs;
}
function docsReplace_(node,start,end,replacement,attrs){
  if(end>start)node.deleteText(start,end-1);
  if(replacement){node.insertText(start,replacement);node.setAttributes(start,start+replacement.length-1,docsRestoreAttrs_(attrs));}
}
function docsApply_(session,edits,rewrite){
  const previous=JSON.parse(JSON.stringify(session)),snap=session.snap,passage=applyEdits(snap.text,edits);
  const full=snap.full.slice(0,snap.start)+passage+snap.full.slice(snap.end);
  const {node}=docsLocate_(snap);let delta=0;
  const inverse=[...edits].sort((a,b)=>a.start-b.start).map(edit=>{
    const record={start:edit.start+delta,end:edit.start+delta+edit.replacement.length,original:edit.replacement,replacement:edit.original,restoreStart:edit.start,runs:docsRuns_(node,snap.start+edit.start,snap.start+edit.end)};
    delta+=edit.replacement.length-(edit.end-edit.start);return record;
  });
  previous.undo=null;
  const undo={previous,inverse};
  const remaining=rewrite?[]:QuillSuggestions.rebase(snap.text,passage,session.remaining,edits);
  docsSize_({...session,snap:{...snap,full,text:passage,end:snap.start+passage.length},result:{...session.result,rewrite:''},remaining,undo});
  // This lock serializes companion scripts; it cannot lock out human collaborators.
  const documentLock=LockService.getDocumentLock();if(!documentLock.tryLock(1000))throw new Error('Another document edit is running. Please wait.');
  try{
    docsLocate_(snap);
    for(const edit of [...edits].sort((a,b)=>b.start-a.start)){
      const attrs=docsAttrs_(node.getAttributes(snap.start+edit.start));docsReplace_(node,snap.start+edit.start,snap.start+edit.end,edit.replacement,attrs);
    }
    const fresh=DocumentApp.getActiveDocument().getActiveTab().asDocumentTab().getBody();
    if(node.getText()!==full)throw new Error('Docs transformed the edit. Review your passage before continuing.');
    session.remaining=remaining;
    session.snap={...snap,full,text:passage,end:snap.start+passage.length,hash:docsHash_(fresh.getText()),formatHash:docsFormatHash_(node)};session.result.rewrite='';session.undo=undo;
  }catch(error){session.remaining=[];session.undo=null;throw new Error(error.message+' Review the document; an edit may have been partly applied.');}
  finally{documentLock.releaseLock();}
}
function docsUndo_(session){
  if(!session.undo)throw new Error('There is no Quill edit to undo.');
  const {node}=docsLocate_(session.snap),{previous,inverse}=session.undo;
  const lock=LockService.getDocumentLock();if(!lock.tryLock(1000))throw new Error('Another document edit is running. Please wait.');
  try{
    docsLocate_(session.snap);
    for(const edit of [...inverse].sort((a,b)=>b.start-a.start))docsReplace_(node,session.snap.start+edit.start,session.snap.start+edit.end,edit.replacement,{});
    for(const edit of inverse)for(const run of edit.runs)node.setAttributes(previous.snap.start+edit.restoreStart+run.start,previous.snap.start+edit.restoreStart+run.end-1,docsRestoreAttrs_(run.attrs));
    if(node.getText()!==previous.snap.full)throw new Error('Docs transformed the undo. Review the document.');
    previous.snap.formatHash=docsFormatHash_(node);
    previous.snap.hash=docsHash_(DocumentApp.getActiveDocument().getActiveTab().asDocumentTab().getBody().getText());
    session.snap=previous.snap;session.result=previous.result;session.remaining=previous.remaining;session.undo=null;
  }finally{lock.releaseLock();}
}
function docsSize_(session){const value=JSON.stringify(session);if(Utilities.newBlob(value).getBytes().length>90000)throw new Error('This passage has too much formatting to track safely. Select a shorter passage.');return value;}
function docsStore_(token,session){CacheService.getUserCache().put('quill:'+token,docsSize_(session),QUILL_DOCS.ttl);}
function docsLoad_(token){
  if(typeof token!=='string'||!/^[a-z0-9-]{36}$/i.test(token))throw new Error('Invalid check session.');
  const value=CacheService.getUserCache().get('quill:'+token);if(!value)throw new Error('This check expired. Check the passage again.');return JSON.parse(value);
}
function docsPublic_(token,session){return {token,text:session.snap.text,summary:session.result.summary,tone:session.result.tone,rewrite:session.result.rewrite,suggestions:session.remaining,canUndo:!!session.undo};}
function docsGenerate_(text,mode){
  validateRequest(text,mode);const settings=docsSettings(),props=PropertiesService.getUserProperties(),key=props.getProperty('quillKey');if(!key)throw new Error('Save your Gemini API key in the sidebar settings first.');
  const until=Number(props.getProperty('quillCooldown')||0);if(Date.now()<until)throw new Error('Gemini is cooling down after a quota error. Wait a minute.');
  let response;
  try{response=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+settings.model+':generateContent',{method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},muteHttpExceptions:true,payload:JSON.stringify({systemInstruction:{parts:[{text:instructions(mode,settings.language)}]},contents:[{role:'user',parts:[{text:JSON.stringify({mode,source:text})}]}],generationConfig:{temperature:settings.model.startsWith('gemini-3')?1:0.2,maxOutputTokens:8192,responseMimeType:'application/json',responseSchema:RESPONSE_SCHEMA}})});}
  catch{throw new Error('Could not reach Gemini. The document has not been changed.');}
  const status=response.getResponseCode();let body;try{body=JSON.parse(response.getContentText());}catch{throw new Error('Gemini returned an unreadable response.');}
  if(status<200||status>=300){
    if(status===429)props.setProperty('quillCooldown',String(Date.now()+60000));
    let detail=String(body.error?.message||'Request failed.').split(key).join('[key removed]').split(text).join('[writing removed]').replace(/AIza[\w-]+/g,'[key removed]').slice(0,1200);
    throw new Error('Gemini HTTP '+status+' · '+settings.model+' · '+detail);
  }
  const candidate=body.candidates?.[0];if(candidate?.finishReason!=='STOP')throw new Error('Gemini did not finish. Try a shorter passage.');
  let data;try{data=JSON.parse(candidate.content.parts.filter(part=>!part.thought).map(part=>part.text||'').join(''));}catch{throw new Error('Gemini returned invalid JSON.');}
  return validateResult(data,text,mode);
}
