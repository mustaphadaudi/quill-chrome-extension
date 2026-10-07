(() => {
  const widget=globalThis.QuillWidget;
  let active=null,enabled=false,autoCheck=false,timer=0,frame=0,epoch=0,statusRequest=0,undo=null;
  const observer=new ResizeObserver(()=>schedule());
  const adapters=globalThis.QuillEditors;
  const docs=location.hostname==='docs.google.com'&&/^\/document\//.test(location.pathname);
  function supported(element){return adapters.resolve(element)===element;}
  function fieldFrom(event){for(const node of event.composedPath?.()||[event.target]){if(widget.owns(node))return null;const field=adapters.resolve(node);if(field)return field;}return null;}
  function reposition(){frame=0;if(!enabled){widget.hide();return;}if(!active?.isConnected||!supported(active)){if(docs&&window.top===window){widget.show({top:innerHeight-60,left:innerWidth-60,right:innerWidth-20,bottom:innerHeight-20,width:40,height:40});widget.docsMode();}else widget.hide();return;}widget.show(active.getBoundingClientRect());}
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
    return adapters.snapshot(active);
  }
  function replace(field,value){adapters.replace(field,0,adapters.read(field).length,value);}
  function applyEdits(text,edits){
    const sorted=[...edits].sort((a,b)=>b.start-a.start);let last=text.length;
    for(const edit of sorted){if(!Number.isInteger(edit.start)||!Number.isInteger(edit.end)||edit.start<0||edit.end>last||text.slice(edit.start,edit.end)!==edit.original)throw new Error('Suggestion mismatch. Check again.');text=text.slice(0,edit.start)+edit.replacement+text.slice(edit.end);last=edit.start;}
    return text;
  }
  function apply(snap,change){
    try{
      if(active!==snap.field||adapters.read(active)!==snap.full)throw new Error('Your text changed. Check it again before applying.');
      const passage=typeof change.rewrite==='string'?change.rewrite:applyEdits(snap.text,change.suggestions);
      const next=snap.full.slice(0,snap.start)+passage+snap.full.slice(snap.end);
      const record={field:snap.field,before:snap.full,after:next,undoStates:[]};
      if(typeof change.rewrite==='string'){record.undoStates.push(snap.full);adapters.replace(snap.field,snap.start,snap.end,passage);}
      else{for(const edit of [...change.suggestions].sort((a,b)=>b.start-a.start)){record.undoStates.push(adapters.read(snap.field));adapters.replace(snap.field,snap.start+edit.start,snap.start+edit.end,edit.replacement);}}
      undo=record;
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
      if(request!==epoch||active!==snap.field||adapters.read(snap.field)!==snap.full)return;
      if(!response?.ok)throw new Error(response?.error||'No response. Reload the extension and page.');
      widget.loading(false);widget.result(response.result,change=>apply(snap,change));
    }catch(error){if(request===epoch){widget.loading(false);widget.message(error.message||'Could not check your writing.');}}
  }
  widget.bind({run,pad:()=>chrome.runtime.sendMessage({type:'QUILL_OPEN_PAD'}),settings:()=>chrome.runtime.sendMessage({type:'QUILL_OPEN_OPTIONS'}).catch(()=>widget.message('Reload the extension to open settings.')),undo:()=>{
    try{if(!undo||undo.field!==active||adapters.read(active)!==undo.after)throw new Error('Text changed since the last edit; undo is unavailable.');const record=undo;undo=null;adapters.undo(record.field,record);clearTimeout(timer);widget.reset();widget.undoAvailable(false);widget.message('Last Quill edit undone.');}
    catch(error){widget.message(error.message);}
  }});
  document.addEventListener('focusin',event=>{if(widget.owns(event.target))return;choose(fieldFrom(event));refreshStatus();},true);
  document.addEventListener('pointerdown',event=>{if(widget.owns(event.target))return;const field=fieldFrom(event);choose(field);refreshStatus();},true);
  document.addEventListener('input',event=>{
    if(widget.owns(event.target))return;const field=fieldFrom(event);if(field&&field!==active)choose(field);if(!active||field!==active)return;epoch++;clearTimeout(timer);widget.reset();widget.undoAvailable(!!undo&&undo.field===active&&adapters.read(active)===undo.after);
    if(enabled&&autoCheck&&!event.isComposing)timer=setTimeout(()=>run('check',true),1600);
  });
  document.addEventListener('compositionend',event=>{if(fieldFrom(event)===active&&enabled&&autoCheck){clearTimeout(timer);timer=setTimeout(()=>run('check',true),1600);}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!widget.owns(event.target))widget.hide();});
  document.addEventListener('keyup',event=>{if(!widget.owns(event.target)){const field=fieldFrom(event);if(field){choose(field);schedule();}}},true);
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);widget.hide();}else refreshStatus();});
  chrome.runtime.onMessage.addListener((message,sender)=>{if(sender.id===chrome.runtime.id&&message?.type==='QUILL_STATUS_CHANGED'){epoch++;clearTimeout(timer);widget.reset();refreshStatus();}});
  choose(adapters.resolve(document.activeElement));refreshStatus();
})();
