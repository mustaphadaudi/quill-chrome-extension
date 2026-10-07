(() => {
  const widget=globalThis.QuillWidget;
  let active=null,enabled=false,autoCheck=false,timer=0,frame=0,epoch=0,statusRequest=0,undo=null;
  const observer=new ResizeObserver(()=>schedule());
  function supported(element){
    if(!(element instanceof HTMLElement)||element.disabled||element.readOnly||element.closest('[inert]'))return false;
    const excluded=/password|cc-|one-time-code|email|tel|username/i.test(element.autocomplete || '');
    return !excluded && (element instanceof HTMLTextAreaElement || (element instanceof HTMLInputElement && element.type==='text'));
  }
  function reposition(){frame=0;if(!enabled||!active?.isConnected||!supported(active)){widget.hide();return;}widget.show(active.getBoundingClientRect());}
  function schedule(){if(!frame)frame=requestAnimationFrame(reposition);}
  async function refreshStatus(){
    const request=++statusRequest;
    try{const response=await chrome.runtime.sendMessage({type:'QUILL_GET_STATUS'});if(request!==statusRequest)return;enabled=response?.ok===true&&response.settings.enabled;autoCheck=response?.settings?.autoCheck===true;}
    catch{enabled=false;}schedule();
  }
  function choose(field){
    if(field===active)return;
    clearTimeout(timer);epoch++;observer.disconnect();active=field;
    widget.reset();widget.undoAvailable(!!undo&&undo.field===active);
    if(active)observer.observe(active);schedule();
  }
  function snapshot(){
    if(!active?.isConnected||!supported(active))throw new Error('Focus a supported text field first.');
    const full=active.value;
    let start=active.selectionStart || 0,end=active.selectionEnd || 0;
    if(start===end){start=0;end=full.length;}
    return {field:active,full,start,end,text:full.slice(start,end)};
  }
  function replace(field,value){
    if(!field.isConnected||!supported(field))throw new Error('This field is no longer editable.');
    const proto=field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);
    field.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:null}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function applyEdits(text,edits){
    const sorted=[...edits].sort((a,b)=>b.start-a.start);let last=text.length;
    for(const edit of sorted){if(!Number.isInteger(edit.start)||!Number.isInteger(edit.end)||edit.start<0||edit.end>last||text.slice(edit.start,edit.end)!==edit.original)throw new Error('Suggestion mismatch. Check again.');text=text.slice(0,edit.start)+edit.replacement+text.slice(edit.end);last=edit.start;}
    return text;
  }
  function apply(snap,change){
    try{
      if(active!==snap.field||active.value!==snap.full)throw new Error('Your text changed. Check it again before applying.');
      const passage=typeof change.rewrite==='string'?change.rewrite:applyEdits(snap.text,change.suggestions);
      const next=snap.full.slice(0,snap.start)+passage+snap.full.slice(snap.end);
      const record={field:snap.field,before:snap.full,after:next};replace(snap.field,next);undo=record;
      epoch++;clearTimeout(timer);widget.reset();widget.undoAvailable(true);widget.message('Applied. Check again for updated suggestions, or undo.');
    }catch(error){widget.message(error.message);}
  }
  async function run(mode,automatic=false){
    clearTimeout(timer);
    if(!enabled)return;
    let snap;try{snap=snapshot();}catch(error){widget.message(error.message);return;}
    if(automatic&&snap.text.trim().length<3)return;
    const request=++epoch;widget.reset();widget.loading(true);widget.message('Checking with Gemini…');if(!automatic)widget.open();
    try{
      const response=await chrome.runtime.sendMessage({type:'QUILL_ANALYZE',text:snap.text,mode});
      if(request!==epoch||active!==snap.field||snap.field.value!==snap.full)return;
      if(!response?.ok)throw new Error(response?.error||'No response. Reload the extension and page.');
      widget.loading(false);widget.result(response.result,change=>apply(snap,change));
    }catch(error){if(request===epoch){widget.loading(false);widget.message(error.message||'Could not check your writing.');}}
  }
  widget.bind({run,settings:()=>chrome.runtime.sendMessage({type:'QUILL_OPEN_OPTIONS'}).catch(()=>widget.message('Reload the extension to open settings.')),undo:()=>{
    try{if(!undo||undo.field!==active||active.value!==undo.after)throw new Error('Text changed since the last edit; undo is unavailable.');const record=undo;undo=null;replace(record.field,record.before);clearTimeout(timer);widget.reset();widget.undoAvailable(false);widget.message('Last Quill edit undone.');}
    catch(error){widget.message(error.message);}
  }});
  document.addEventListener('focusin',event=>{if(widget.owns(event.target))return;choose(supported(event.target)?event.target:null);refreshStatus();});
  document.addEventListener('pointerdown',event=>{if(widget.owns(event.target)||event.target===active)return;choose(null);},true);
  document.addEventListener('input',event=>{
    if(event.target!==active)return;epoch++;clearTimeout(timer);widget.reset();widget.undoAvailable(!!undo&&undo.field===active&&active.value===undo.after);
    if(enabled&&autoCheck&&!event.isComposing)timer=setTimeout(()=>run('check',true),1600);
  });
  document.addEventListener('compositionend',event=>{if(event.target===active&&enabled&&autoCheck){clearTimeout(timer);timer=setTimeout(()=>run('check',true),1600);}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!widget.owns(event.target))widget.hide();});
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);widget.hide();}else refreshStatus();});
  chrome.runtime.onMessage.addListener((message,sender)=>{if(sender.id===chrome.runtime.id&&message?.type==='QUILL_STATUS_CHANGED'){epoch++;clearTimeout(timer);widget.reset();refreshStatus();}});
  choose(supported(document.activeElement)?document.activeElement:null);refreshStatus();
})();
