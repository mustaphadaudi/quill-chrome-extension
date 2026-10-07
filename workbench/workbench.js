import {applyEdits} from '../background/gemini.js';
const $=id=>document.getElementById(id);let revision=0,undo=null;
function clear(){revision++;$('results').replaceChildren();$('undo').disabled=true;}
$('source').addEventListener('input',()=>{clear();undo=null;$('status').textContent='Text changed. Check again for updated suggestions.';});
function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
function apply(before,next){if($('source').value!==before){$('status').textContent='Text changed. Check it again.';return;}undo={before,after:next};$('source').value=next;clear();$('undo').disabled=false;$('status').textContent='Applied. Copy the text back to your document.';}
async function run(mode){
 const before=$('source').value,request=++revision;$('results').replaceChildren();$('status').textContent='Checking with Gemini…';$('check').disabled=$('rewrite').disabled=true;
 try{
  const response=await chrome.runtime.sendMessage({type:'QUILL_ANALYZE',text:before,mode});if(request!==revision)return;if(!response?.ok)throw new Error(response?.error||'No response from Quill.');
  const result=response.result;$('status').textContent=[result.tone&&`Tone: ${result.tone}`,result.summary].filter(Boolean).join(' · ');
  if(result.rewrite){const text=document.createElement('p');text.className='preview';text.textContent=result.rewrite;$('results').append(text,button('Use rewrite',()=>apply(before,result.rewrite)));}
  else{
   let remaining=[...result.suggestions];
   if(!remaining.length){$('status').textContent+=' No changes suggested.';return;}
   const all=button('Apply all suggestions',()=>apply(before,applyEdits(before,remaining)));$('results').append(all);
   for(const edit of result.suggestions){const item=document.createElement('article'),kind=document.createElement('small'),old=document.createElement('del'),next=document.createElement('strong'),explanation=document.createElement('p');kind.textContent=edit.category;old.textContent=edit.original;next.textContent=edit.replacement||'(delete)';explanation.textContent=edit.explanation;item.append(kind,old,next,explanation,button('Accept',()=>apply(before,applyEdits(before,[edit]))),button('Dismiss',()=>{remaining=remaining.filter(x=>x!==edit);item.remove();all.disabled=!remaining.length;}));$('results').append(item);}
  }
 }catch(error){if(request===revision)$('status').textContent=error.message;}
 finally{$('check').disabled=$('rewrite').disabled=false;}
}
$('check').addEventListener('click',()=>run('check'));$('rewrite').addEventListener('click',()=>run($('mode').value));
$('undo').addEventListener('click',()=>{if(!undo||$('source').value!==undo.after){$('status').textContent='Text changed; undo is unavailable.';return;}$('source').value=undo.before;undo=null;clear();$('status').textContent='Last edit undone.';});
$('settings').addEventListener('click',()=>chrome.runtime.openOptionsPage());
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('source').value);$('status').textContent='Copied. Paste it back into your document.';}catch{$('source').select();$('status').textContent='Text selected. Press Ctrl+C to copy.';}});
