/* Captures editing events even inside Docs' hidden input iframe. */
(() => {
  function changed(event){if(event.composedPath().some(node=>['quill-docs-overlay','quill-widget'].includes(node.id)||node.tagName==='QUILL-WIDGET'))return;void chrome.runtime.sendMessage({type:'QUILL_DOCS_DIRTY'}).catch(()=>{});}
  document.addEventListener('input',changed,true);document.addEventListener('compositionend',changed,true);
  document.addEventListener('keydown',event=>{if(event.isComposing)return;if(!event.altKey&&!event.ctrlKey&&!event.metaKey&&(event.key.length===1||['Backspace','Delete','Enter'].includes(event.key))||((event.ctrlKey||event.metaKey)&&['v','x','z'].includes(event.key.toLowerCase())))changed(event);},true);
})();
