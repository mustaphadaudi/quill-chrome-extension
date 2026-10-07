/* ISOLATED-world bridge inside the Apps Script HTML sidebar frame. */
(() => {
  if(!/^(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$|^[a-z0-9-]+-script\.googleusercontent\.com$/.test(location.hostname))return;
  let nonce=null;
  window.addEventListener('message',async event=>{
    const data=event.data;if(event.source!==window||data?.source!=='quill-docs-sidebar'||data.type!=='publish'||!document.querySelector('meta[name="quill-docs-companion"]'))return;
    if(typeof data.payload?.nonce!=='string')return;nonce=data.payload.nonce;
    try{const response=await chrome.runtime.sendMessage({type:'QUILL_DOCS_PUBLISH',data:data.payload});window.postMessage({source:'quill-docs-extension',type:'connection',nonce,ok:response?.ok===true,error:response?.error||''},location.origin);}catch{window.postMessage({source:'quill-docs-extension',type:'connection',nonce,ok:false,error:'Reload the Chrome extension and Docs page.'},location.origin);}
  });
  chrome.runtime.onMessage.addListener((message,sender)=>{
    if(sender.id!==chrome.runtime.id||message?.nonce!==nonce||!['QUILL_DOCS_COMMAND','QUILL_DOCS_FEEDBACK'].includes(message.type))return;
    window.postMessage({...message,source:'quill-docs-extension',type:message.type==='QUILL_DOCS_COMMAND'?'command':'feedback'},location.origin);
  });
})();
