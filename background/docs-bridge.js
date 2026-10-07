/* Routes companion messages between frames in one Docs tab. No keys or OAuth tokens. */
export const TYPES=['QUILL_DOCS_TOP','QUILL_DOCS_PUBLISH','QUILL_DOCS_ACTION','QUILL_DOCS_FEEDBACK','QUILL_DOCS_DIRTY'];
const nonce=value=>typeof value==='string'&&/^[a-z0-9-]{36}$/i.test(value);
const key=tab=>`quillDocsRoute:${tab}`;
function docsId(url){try{const u=new URL(url);return u.hostname==='docs.google.com'?u.pathname.match(/^\/document\/d\/([a-zA-Z0-9_-]+)\//)?.[1]:null;}catch{return null;}}
function companion(url){try{const u=new URL(url);return u.protocol==='https:'&&(/^(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(u.hostname)||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}}
export async function routeDocs(message,sender){
  if(!Number.isInteger(sender.tab?.id)||!sender.documentId)throw new Error('Reload Docs to connect the inline layer.');
  const storageKey=key(sender.tab.id),stored=await chrome.storage.session.get(storageKey);let route=stored[storageKey];
  if(message.type==='QUILL_DOCS_TOP'){
    const docId=docsId(sender.url);if(sender.frameId!==0||!docId)throw new Error('Inline registration requires the document frame.');
    if(!route||route.top!==sender.documentId||route.docId!==docId){route={top:sender.documentId,docId};await chrome.storage.session.set({[storageKey]:route});}return {ok:true};
  }
  if(message.type==='QUILL_DOCS_DIRTY'){if(route&&((sender.origin==='https://docs.google.com')||new URL(sender.url).hostname==='docs.google.com'))await chrome.tabs.sendMessage(sender.tab.id,{type:'QUILL_DOCS_DIRTY'},{documentId:route.top});return {ok:true};}
  if(!route)throw new Error('Reload the Docs page before connecting inline markers.');
  if(message.type==='QUILL_DOCS_PUBLISH'){
    const data=message.data;if(!companion(sender.url)||!nonce(data?.nonce)||data.docId!==route.docId||JSON.stringify(data).length>100000)throw new Error('The sidebar does not match this document.');
    if(typeof data.enabled!=='boolean'||typeof data.live!=='boolean')throw new Error('Invalid inline settings.');
    if(data.session){const s=data.session;if(!nonce(s.token)||s.anchor?.docId!==route.docId||typeof s.anchor.full!=='string'||s.anchor.full.length>24000||!Array.isArray(s.suggestions)||s.suggestions.length>20)throw new Error('Invalid inline check.');}
    route={...route,companion:sender.documentId,nonce:data.nonce,stamp:Date.now()};await chrome.storage.session.set({[storageKey]:route});
    await chrome.tabs.sendMessage(sender.tab.id,{type:'QUILL_DOCS_STATE',data},{documentId:route.top});return {ok:true};
  }
  if(sender.frameId!==0||sender.documentId!==route.top||message.nonce!==route.nonce||!route.companion||Date.now()-route.stamp>45000)throw new Error('Reopen the Quill Docs sidebar to reconnect.');
  const {settings}=await chrome.storage.local.get('settings');if(settings?.enabled===false)throw new Error('Quill is paused.');
  if(message.type==='QUILL_DOCS_ACTION'){
    if(!['accept','dismiss','undo','check'].includes(message.action)||message.action==='accept'&&(!Number.isInteger(message.index)||message.index<0||message.index>19))throw new Error('Unknown inline action.');
    await chrome.tabs.sendMessage(sender.tab.id,{type:'QUILL_DOCS_COMMAND',nonce:route.nonce,action:message.action,index:message.index??null,token:message.token??null},{documentId:route.companion});
  }else if(message.type==='QUILL_DOCS_FEEDBACK'){
    await chrome.tabs.sendMessage(sender.tab.id,{type:'QUILL_DOCS_FEEDBACK',nonce:route.nonce,text:String(message.text||'').slice(0,300)},{documentId:route.companion});
  }return {ok:true};
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(sender.id!==chrome.runtime.id||!TYPES.includes(message?.type))return false;
  (async()=>{try{reply(await routeDocs(message,sender));}catch(error){reply({ok:false,error:error.message||'Inline bridge unavailable.'});}})();return true;
});
chrome.tabs?.onRemoved?.addListener(tab=>{void chrome.storage.session.remove(key(tab));});
