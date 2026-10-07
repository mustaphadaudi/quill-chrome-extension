/* ISOLATED-world Docs overlay. All writes are delegated to the bound sidebar. */
(() => {
  if(window.top!==window||!/^\/document\/d\//.test(location.pathname))return;
  const host=document.createElement('div');host.id='quill-docs-overlay';host.style.cssText='position:fixed;inset:0;z-index:2147483646;pointer-events:none';document.documentElement.append(host);
  const root=host.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=`:host{all:initial}.ink{position:fixed;inset:0;pointer-events:none}.mark{position:fixed;padding:0;border:0;background:transparent;pointer-events:auto;cursor:pointer;border-radius:2px}.mark:focus-visible{outline:2px solid #168463}.card{position:fixed;width:270px;max-width:calc(100vw - 24px);background:#fff;color:#20372e;border:1px solid #d8e5dd;border-radius:12px;box-shadow:0 12px 40px #183d302b;padding:14px;pointer-events:auto;font:13px/1.45 system-ui,sans-serif}.card[hidden]{display:none}.kind{color:#b43749;font-size:11px;text-transform:capitalize}.before{color:#b43749;white-space:pre-wrap}.after{color:#138364;white-space:pre-wrap}.explanation{color:#62766b;margin:8px 0 12px}.actions{display:flex;gap:7px}.actions button{font:inherit;padding:8px 12px;border:1px solid #d8e5dd;border-radius:7px;cursor:pointer;background:#fff;color:#244d3b}.actions .accept{background:#138364;color:white;border-color:#138364}button:focus-visible{outline:2px solid #168463;outline-offset:2px}button:disabled{opacity:.5;cursor:wait}.status{margin:8px 0 0;font-size:11px;color:#62766b}`;root.append(style);
  const ink=document.createElement('canvas');ink.className='ink';const marks=document.createElement('div'),card=document.createElement('div');card.className='card';card.hidden=true;card.role='dialog';card.setAttribute('aria-label','Quill correction');root.append(ink,marks,card);
  const ctx=ink.getContext('2d'),measureCtx=new OffscreenCanvas(1,1).getContext('2d');
  let state=null,enabled=true,dirty=false,pending=false,openIndex=null,frame=0,latest='',feedback='',closeTimer=0,liveTimer=0,lastScroll=0,connectedAt=0;
  function measure(run,text){measureCtx.font=run.font;measureCtx.fontKerning=run.kern||'auto';measureCtx.letterSpacing=run.letterSpacing||'0px';measureCtx.wordSpacing=run.wordSpacing||'0px';return measureCtx.measureText(text).width;}
  function clear(){ctx.clearRect(0,0,ink.width,ink.height);marks.replaceChildren();marks.dataset.signature='';card.hidden=true;openIndex=null;}
  function tell(text){if(text===feedback||!state?.nonce)return;feedback=text;void chrome.runtime.sendMessage({type:'QUILL_DOCS_FEEDBACK',nonce:state.nonce,text}).catch(()=>{});}
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!state?.enabled||!state.session||dirty||!enabled||state.busy||pending||document.hidden){clear();return;}latest=crypto.randomUUID();window.postMessage({source:'quill-overlay',type:'snapshot',id:latest},location.origin);});}
  function draw(projected){
    const ratio=devicePixelRatio||1;if(ink.width!==Math.ceil(innerWidth*ratio)||ink.height!==Math.ceil(innerHeight*ratio)){ink.width=Math.ceil(innerWidth*ratio);ink.height=Math.ceil(innerHeight*ratio);ink.style.width=innerWidth+'px';ink.style.height=innerHeight+'px';}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);ctx.strokeStyle='#d63b50';ctx.lineWidth=1.6;
    const visible=projected.marks.filter(m=>m.right>0&&m.left<innerWidth&&m.bottom>0&&m.top<innerHeight),signature=JSON.stringify(visible);
    for(const mark of visible){ctx.beginPath();for(let x=mark.left;x<=mark.right;x+=1){const y=mark.bottom+2+Math.sin((x-mark.left)*Math.PI/3)*1.2;if(x===mark.left)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
    if(marks.dataset.signature!==signature){marks.dataset.signature=signature;marks.replaceChildren();for(const m of visible){const button=document.createElement('button');button.type='button';button.className='mark';button.dataset.index=m.index;button.style.cssText=`left:${m.left}px;top:${m.top}px;width:${m.right-m.left}px;height:${Math.max(10,m.bottom-m.top+6)}px`;button.setAttribute('aria-label',`Quill: ${state.session.suggestions[m.index]?.original||'correction'}`);button.addEventListener('pointerenter',()=>show(m.index));button.addEventListener('focus',()=>show(m.index));button.addEventListener('click',()=>show(m.index));button.addEventListener('pointerleave',laterClose);marks.append(button);}}
    if(openIndex!==null){const mark=visible.find(m=>m.index===openIndex);if(mark)place(mark);else{card.hidden=true;openIndex=null;}}
    tell(projected.reason);
  }
  function place(mark){const box=card.getBoundingClientRect(),left=Math.max(12,Math.min(mark.left,innerWidth-box.width-12));let top=mark.bottom+10;if(top+box.height>innerHeight-12)top=Math.max(12,mark.top-box.height-10);card.style.left=left+'px';card.style.top=top+'px';}
  function show(index){
    clearTimeout(closeTimer);const edit=state?.session?.suggestions[index];if(!edit||dirty||pending||state.busy)return;openIndex=index;card.replaceChildren();
    const kind=document.createElement('div'),before=document.createElement('del'),after=document.createElement('strong'),explanation=document.createElement('p'),actions=document.createElement('div');kind.className='kind';kind.textContent=edit.category;before.className='before';before.textContent=edit.original;after.className='after';after.textContent=' → '+(edit.replacement||'(delete)');explanation.className='explanation';explanation.textContent=edit.explanation;actions.className='actions';
    for(const [label,action] of [['Accept','accept'],['Dismiss','dismiss']]){const button=document.createElement('button');button.type='button';button.className=action;button.textContent=label;button.addEventListener('click',()=>command(action,index));actions.append(button);}
    if(state.session.canUndo){const button=document.createElement('button');button.type='button';button.textContent='Undo';button.addEventListener('click',()=>command('undo'));actions.append(button);}
    card.append(kind,before,after,explanation,actions);card.hidden=false;const button=marks.querySelector(`[data-index="${index}"]`);if(button)place(button.getBoundingClientRect());
  }
  function laterClose(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!card.matches(':hover')&&!card.contains(root.activeElement)){card.hidden=true;openIndex=null;}},220);}
  async function command(action,index){
    if(!state?.nonce||pending)return;pending=true;clearTimeout(liveTimer);const current=state;
    try{const response=await chrome.runtime.sendMessage({type:'QUILL_DOCS_ACTION',nonce:current.nonce,token:current.session?.token,action,index});if(!response?.ok)throw new Error(response?.error||'Inline action unavailable.');clear();tell('Applying through the Quill sidebar…');}
    catch(error){pending=false;tell(error.message);schedule();}
    setTimeout(()=>{if(pending){pending=false;tell('No edit response. Check the Quill sidebar and reconnect if needed.');schedule();}},15000);
  }
  function typed(){if(!state?.enabled)return;dirty=true;clear();clearTimeout(liveTimer);tell(state.live?'Waiting for typing to pause…':'Text changed. Check the paragraph again.');if(state.live)liveTimer=setTimeout(()=>{if(!document.hidden&&!state.busy&&!pending)void command('check');},1800);}
  card.addEventListener('pointerenter',()=>clearTimeout(closeTimer));card.addEventListener('pointerleave',laterClose);card.addEventListener('keydown',event=>{if(event.key==='Escape'){card.hidden=true;openIndex=null;}});
  window.addEventListener('message',event=>{
    if(event.source!==window||event.origin!==location.origin||event.data?.source!=='quill-canvas')return;
    if(event.data.type==='changed'){schedule();return;}
    if(event.data.type!=='snapshot'||event.data.id!==latest||!state?.session||dirty||pending||!state.enabled||!enabled)return;
    const result=QuillDocsGeometry.project(state.session.anchor,state.session.suggestions,Array.isArray(event.data.runs)?event.data.runs:[],measure);draw(result);
  });
  chrome.runtime.onMessage.addListener((message,sender)=>{
    if(sender.id!==chrome.runtime.id)return;
    if(message.type==='QUILL_DOCS_STATE'){
      const previous=state;state=message.data;connectedAt=Date.now();pending=false;
      if(previous?.session?.token!==state.session?.token||JSON.stringify(previous?.session)!==JSON.stringify(state.session)){dirty=false;marks.dataset.signature='';openIndex=null;card.hidden=true;}
      if(!state.enabled){clearTimeout(liveTimer);clear();}else schedule();
    }else if(message.type==='QUILL_DOCS_DIRTY')typed();else if(message.type==='QUILL_STATUS_CHANGED')void status();
  });
  async function status(){try{const response=await chrome.runtime.sendMessage({type:'QUILL_GET_STATUS'});enabled=response?.ok===true&&response.settings.enabled;}catch{enabled=false;}schedule();}
  async function register(){try{await chrome.runtime.sendMessage({type:'QUILL_DOCS_TOP'});}catch{}}
  window.addEventListener('scroll',()=>{lastScroll=Date.now();schedule();},true);window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  const observer=new MutationObserver(records=>{if(records.some(r=>r.target!==host&&!host.contains(r.target)))schedule();});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','width','height','transform']});
  new ResizeObserver(schedule).observe(document.documentElement);document.fonts?.addEventListener('loadingdone',schedule);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else{void register();schedule();}});
  setInterval(()=>{if(state&&Date.now()-connectedAt>45000){state=null;clear();}if(!document.hidden&&Date.now()-lastScroll>150) schedule();},1500);
  void register();void status();
})();
