import {applyEdits} from '../background/gemini.js';
const $=id=>document.getElementById(id);let revision=0,undo=null,session=null;
function clear(){QuillHighlights.clear();revision++;session=null;$('results').replaceChildren();$('undo').disabled=true;}
$('source').addEventListener('input',()=>{clear();undo=null;$('status').textContent='Text changed. Check again for updated suggestions.';});
function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
function apply(before,next,accepted=null){
 if($('source').value!==before){$('status').textContent='Text changed. Check it again.';return;}
 try{
  const previous=session,nextEdits=accepted&&previous?QuillSuggestions.rebase(before,next,previous.remaining,accepted):null;
  undo={before,after:next,session:previous};$('source').value=next;clear();
  if(nextEdits){session={...previous,before:next,remaining:nextEdits};render();$('status').textContent=nextEdits.length?`Applied. ${nextEdits.length} suggestion${nextEdits.length===1?'':'s'} remaining.`:'All current suggestions resolved. Copy your text back to the document.';}
  else $('status').textContent='Applied. Copy the text back to your document.';
  $('undo').disabled=false;
 }catch(error){$('status').textContent=error.message;}
}
function render(){
 QuillHighlights.clear();$('results').replaceChildren();if(!session)return;
 const {before,result,remaining}=session;
 $('status').textContent=[result.tone&&`Tone: ${result.tone}`,result.summary].filter(Boolean).join(' · ');
 if(result.rewrite){const text=document.createElement('p');text.className='preview';text.textContent=result.rewrite;$('results').append(text,button('Use rewrite',()=>apply(before,result.rewrite)));return;}
 if(!remaining.length){$('status').textContent+=' No remaining suggestions.';return;}
 const accept=edits=>apply(before,applyEdits(before,edits),edits);
 const dismiss=edit=>{session={...session,remaining:session.remaining.filter(x=>x!==edit)};render();};
 $('results').append(button('Apply all suggestions',()=>accept(remaining)));
 for(const edit of remaining){
  const item=document.createElement('article'),kind=document.createElement('small'),old=document.createElement('del'),next=document.createElement('strong'),explanation=document.createElement('p');
  kind.textContent=edit.category;old.textContent=edit.original;next.textContent=edit.replacement||'(delete)';explanation.textContent=edit.explanation;
  item.append(kind,old,next,explanation,button('Accept',()=>accept([edit])),button('Dismiss',()=>dismiss(edit)));$('results').append(item);
 }
 QuillHighlights.show({field:$('source'),full:before,start:0},remaining,edit=>accept([edit]),dismiss);
}
async function run(mode){
 const before=$('source').value,request=++revision;QuillHighlights.clear();session=null;$('results').replaceChildren();$('status').textContent='Checking with Gemini…';$('check').disabled=$('rewrite').disabled=true;
 try{
  const response=await chrome.runtime.sendMessage({type:'QUILL_ANALYZE',text:before,mode});if(request!==revision)return;if(!response?.ok)throw new Error(response?.error||'No response from Quill.');
  session={before,result:response.result,remaining:[...response.result.suggestions]};render();
 }catch(error){if(request===revision)$('status').textContent=error.message;}
 finally{$('check').disabled=$('rewrite').disabled=false;}
}
$('check').addEventListener('click',()=>run('check'));$('rewrite').addEventListener('click',()=>run($('mode').value));
$('undo').addEventListener('click',()=>{
 if(!undo||$('source').value!==undo.after){$('status').textContent='Text changed; undo is unavailable.';return;}
 const record=undo;$('source').value=record.before;undo=null;clear();session=record.session;render();$('status').textContent='Last edit undone. Suggestions restored.';
});
$('settings').addEventListener('click',()=>chrome.runtime.openOptionsPage());
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('source').value);$('status').textContent='Copied. Paste it back into your document.';}catch{$('source').select();$('status').textContent='Text selected. Press Ctrl+C to copy.';}});
