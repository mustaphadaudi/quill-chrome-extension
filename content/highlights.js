(() => {
  // Coordinates are measured without inserting markup into the user's editor.
  const host=document.createElement('div');host.setAttribute('data-quill-highlights','');
  host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483646!important;pointer-events:none!important;';
  const root=host.attachShadow({mode:'open'}),style=document.createElement('style');
  style.textContent=`:host{font:14px/1.5 system-ui;color:#20372f}*{box-sizing:border-box;font-family:system-ui}button{cursor:pointer}.mark{position:fixed;height:3px;border:0;border-bottom:2px solid #e44454;background:transparent;padding:0;pointer-events:auto;border-radius:2px}.mark:focus{outline:2px solid #147d64;outline-offset:3px}.tip{position:fixed;width:280px;max-width:calc(100vw - 16px);background:white;border:1px solid #dae6e0;border-radius:12px;box-shadow:0 10px 35px #172b2533;padding:16px;pointer-events:auto}.tip[hidden]{display:none}small{display:block;color:#bc3042;text-transform:capitalize}del{color:#bc3042;margin-right:12px}strong{color:#147d64;white-space:pre-wrap}p{font-size:13px;margin:10px 0;color:#52665e}button.accept,button.dismiss{border:0;border-radius:7px;padding:8px 12px;font-size:13px}.accept{background:#147d64;color:white;margin-right:8px}.dismiss{background:#edf3ef;color:#385448}`;
  const marks=document.createElement('div'),tip=document.createElement('section');tip.className='tip';tip.hidden=true;tip.setAttribute('aria-label','Quill correction');
  root.append(style,marks,tip);host.addEventListener('pointerdown',event=>event.stopPropagation());
  let state=null,boxes=[],frame=0,hoverTimer=0,hideTimer=0,current=null;
  const plain=field=>field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement;
  function clear(){state=null;boxes=[];current=null;marks.replaceChildren();tip.hidden=true;clearTimeout(hoverTimer);clearTimeout(hideTimer);hoverTimer=hideTimer=0;}
  function clip(field){
    const rect=field.getBoundingClientRect();let area={left:Math.max(0,rect.left+field.clientLeft),top:Math.max(0,rect.top+field.clientTop),right:Math.min(innerWidth,rect.left+field.clientLeft+field.clientWidth),bottom:Math.min(innerHeight,rect.top+field.clientTop+field.clientHeight)};
    for(let node=field.parentElement;node;node=node.parentElement){const css=getComputedStyle(node),r=node.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(css.overflowX)){area.left=Math.max(area.left,r.left);area.right=Math.min(area.right,r.right);}if(/auto|scroll|hidden|clip/.test(css.overflowY)){area.top=Math.max(area.top,r.top);area.bottom=Math.min(area.bottom,r.bottom);}}
    return area;
  }
  function geometry(field,edits,start){
    if(!plain(field))return edits.map(edit=>({edit,rects:Array.from(QuillEditors.range(field,start+edit.start,start+edit.end).getClientRects())}));
    const css=getComputedStyle(field),rect=field.getBoundingClientRect(),mirror=document.createElement('div');
    const props=['fontFamily','fontSize','fontWeight','fontStyle','fontVariant','lineHeight','letterSpacing','wordSpacing','textIndent','textAlign','direction','tabSize','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','boxSizing'];
    mirror.style.cssText='all:initial;position:fixed;visibility:hidden;pointer-events:none;margin:0;border-style:solid;border-color:transparent;';for(const prop of props)mirror.style[prop]=css[prop];
    mirror.style.width=`${field.clientWidth+parseFloat(css.borderLeftWidth)+parseFloat(css.borderRightWidth)}px`;mirror.style.boxSizing='border-box';mirror.style.whiteSpace=field instanceof HTMLTextAreaElement&&field.wrap!=='off'?'pre-wrap':'pre';mirror.style.overflowWrap='break-word';
    mirror.style.left=`${rect.left-field.scrollLeft}px`;mirror.style.top=`${rect.top-field.scrollTop}px`;mirror.textContent=field.value;document.documentElement.append(mirror);
    const node=mirror.firstChild;
    if(field instanceof HTMLInputElement&&node){const line=document.createRange();line.selectNodeContents(mirror);const r=line.getBoundingClientRect();mirror.style.top=`${rect.top+(rect.height-r.height)/2-parseFloat(css.paddingTop)-parseFloat(css.borderTopWidth)}px`;}
    try{return edits.map(edit=>{const r=document.createRange();r.setStart(node,start+edit.start);r.setEnd(node,start+edit.end);return {edit,rects:Array.from(r.getClientRects())};});}finally{mirror.remove();}
  }
  function render(){
    frame=0;if(!state)return;
    if(!state.field.isConnected||QuillEditors.read(state.field)!==state.full){clear();return;}
    const previous=current,focused=root.activeElement?.classList.contains('mark');
    const area=clip(state.field);boxes=[];marks.replaceChildren();
    for(const {edit,rects} of geometry(state.field,state.edits,state.start))for(const r of rects){
      const left=Math.max(r.left,area.left),right=Math.min(r.right,area.right),top=Math.max(r.top,area.top),bottom=Math.min(r.bottom,area.bottom);
      if(right<=left||bottom<=top||r.bottom>area.bottom+2)continue;
      const box={left,right,top,bottom,edit};boxes.push(box);
      const mark=document.createElement('button');mark.type='button';mark.className='mark';mark.setAttribute('aria-label',`Quill ${edit.category}: ${edit.original}. Suggested: ${edit.replacement||'delete'}`);
      mark.style.cssText=`left:${left}px;top:${bottom-1}px;width:${right-left}px`;
      box.mark=mark;mark.addEventListener('focus',()=>open(box));mark.addEventListener('click',()=>open(box));marks.append(mark);
    }
    const selected=boxes.find(box=>box.edit===previous);
    if(selected){open(selected);if(focused)selected.mark.focus({preventScroll:true});}else{tip.hidden=true;current=null;}
  }
  function schedule(){if(state&&!frame)frame=requestAnimationFrame(render);}
  function open(box){
    if(!state)return;clearTimeout(hideTimer);hideTimer=0;clearTimeout(hoverTimer);if(current===box.edit&&!tip.hidden){position(box);return;}current=box.edit;
    tip.replaceChildren();const kind=document.createElement('small'),before=document.createElement('del'),after=document.createElement('strong'),why=document.createElement('p');
    kind.textContent=box.edit.category;before.textContent=box.edit.original;after.textContent=box.edit.replacement||'(delete)';why.textContent=box.edit.explanation;
    const accept=document.createElement('button'),dismiss=document.createElement('button');accept.type=dismiss.type='button';accept.className='accept';dismiss.className='dismiss';accept.textContent='Accept';dismiss.textContent='Dismiss';
    accept.addEventListener('click',()=>state?.accept(box.edit));dismiss.addEventListener('click',()=>state?.dismiss(box.edit));tip.append(kind,before,after,why,accept,dismiss);tip.hidden=false;
    position(box);
  }
  function position(box){
    const width=tip.getBoundingClientRect().width;tip.style.left=`${Math.max(8,Math.min(box.left,innerWidth-width-8))}px`;const height=tip.getBoundingClientRect().height;tip.style.top=`${box.bottom+height+14<innerHeight?box.bottom+8:Math.max(8,box.top-height-8)}px`;
  }
  document.addEventListener('pointermove',event=>{
    if(!state)return;if(event.composedPath().includes(host)){clearTimeout(hideTimer);hideTimer=0;return;}
    const box=boxes.find(b=>event.clientX>=b.left&&event.clientX<=b.right&&event.clientY>=b.top&&event.clientY<=b.bottom+4);
    if(box){clearTimeout(hideTimer);hideTimer=0;if(current!==box.edit){clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>open(box),120);}}
    else{clearTimeout(hoverTimer);if(!tip.hidden&&!hideTimer)hideTimer=setTimeout(()=>{tip.hidden=true;current=null;hideTimer=0;},250);}
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){tip.hidden=true;current=null;}});
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
  const resize=new ResizeObserver(schedule);
  globalThis.QuillHighlights={
    show(snap,edits,accept,dismiss){clear();resize.disconnect();if(!edits.length)return;state={...snap,edits,accept,dismiss};if(!host.isConnected)document.documentElement.append(host);resize.observe(snap.field);render();},
    clear(){clear();resize.disconnect();},schedule,owns:element=>element===host
  };
})();
