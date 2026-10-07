(() => {
  const host = document.createElement('div');host.setAttribute('data-quill-widget','');
  host.style.cssText='all:initial!important;position:fixed!important;z-index:2147483647!important;display:none!important;';
  const root=host.attachShadow({mode:'open'});
  const css=document.createElement('link');css.rel='stylesheet';css.href=chrome.runtime.getURL('content/widget.css');
  const button=document.createElement('button');button.className='indicator';button.type='button';button.textContent='Q';button.setAttribute('aria-label','Open Quill writing assistant');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','quill-card');
  const card=document.createElement('section');card.id='quill-card';card.hidden=true;card.setAttribute('aria-label','Quill writing assistant');
  // Static local markup only. Every model-generated string below uses textContent.
  card.innerHTML='<header><strong>Quill</strong><button class="close" type="button" aria-label="Close suggestions">×</button></header><p class="intro">Your words, a little clearer.</p><div class="actions"><button class="primary check" type="button">Check writing</button><button class="settings" type="button" aria-label="Open Quill settings">⚙</button></div><div class="rewrite-controls"><select aria-label="Rewrite style"><option value="clearer">Clearer</option><option value="concise">More concise</option><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="confident">Confident</option></select><button class="rewrite" type="button">Rewrite</button></div><p class="status" role="status" aria-live="polite">Check this field or select a passage first.</p><div class="results"></div><footer><button class="undo" type="button" disabled>Undo last edit</button><span>Personal edition</span></footer>';
  root.append(css,card,button);
  const q=selector=>card.querySelector(selector);
  let handlers={};
  const setOpen=open=>{card.hidden=!open;button.setAttribute('aria-expanded',String(open));};
  button.addEventListener('click',()=>setOpen(card.hidden));
  q('.close').addEventListener('click',()=>{setOpen(false);button.focus();});
  q('.check').addEventListener('click',()=>handlers.run?.('check'));
  q('.rewrite').addEventListener('click',()=>handlers.run?.(q('select').value));
  q('.settings').addEventListener('click',()=>handlers.settings?.());
  q('.undo').addEventListener('click',()=>handlers.undo?.());
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){setOpen(false);button.focus();}});
  document.addEventListener('pointerdown',event=>{if(!event.composedPath().includes(host))setOpen(false);},true);
  function action(label,callback,classes='') {const b=document.createElement('button');b.type='button';b.textContent=label;b.className=classes;b.addEventListener('click',callback);return b;}
  globalThis.QuillWidget={
    bind(next){handlers=next;},
    message(text){q('.status').textContent=text;},
    loading(value){for(const selector of ['.check','.rewrite','select'])q(selector).disabled=value;button.textContent=value?'…':'Q';},
    reset(){q('.results').replaceChildren();this.loading(false);this.message('Check this field or select a passage first.');},
    undoAvailable(value){q('.undo').disabled=!value;},
    result(result,onApply){
      const container=q('.results');container.replaceChildren();
      this.message([result.tone && `Tone: ${result.tone}`,result.summary].filter(Boolean).join(' · '));
      button.textContent=result.suggestions.length?String(result.suggestions.length):'Q';
      if(result.rewrite){const preview=document.createElement('p');preview.className='rewrite-preview';preview.textContent=result.rewrite;container.append(preview,action('Use rewrite',()=>onApply({rewrite:result.rewrite}),'primary'));return;}
      if(!result.suggestions.length){const p=document.createElement('p');p.textContent='No changes suggested.';container.append(p);return;}
      let remaining=[...result.suggestions];
      const all=action('Apply all suggestions',()=>onApply({suggestions:remaining}),'primary apply-all');container.append(all);
      result.suggestions.forEach(edit=>{
        const item=document.createElement('article');
        const category=document.createElement('small');category.textContent=edit.category;
        const before=document.createElement('del');before.textContent=edit.original;
        const after=document.createElement('strong');after.textContent=edit.replacement || '(delete)';
        const explanation=document.createElement('p');explanation.textContent=edit.explanation;
        item.append(category,before,after,explanation,action('Accept',()=>onApply({suggestions:[edit]}),'accept'),action('Dismiss',()=>{remaining=remaining.filter(candidate=>candidate!==edit);item.remove();all.disabled=remaining.length===0;button.textContent=remaining.length?String(remaining.length):'Q';},'dismiss'));
        container.append(item);
      });
    },
    show(rect){
      if(!host.isConnected)document.documentElement.append(host);
      const visible=rect.bottom>0&&rect.right>0&&rect.top<innerHeight&&rect.left<innerWidth&&rect.width>0&&rect.height>0;
      if(!visible){this.hide();return;}
      const x=Math.min(Math.max(8,rect.right-40),Math.max(8,innerWidth-44));
      const y=Math.min(Math.max(8,rect.bottom-40),Math.max(8,innerHeight-44));
      host.style.setProperty('left',`${x}px`,'important');host.style.setProperty('top',`${y}px`,'important');host.style.setProperty('display','block','important');
      const width=Math.min(340,Math.max(100,innerWidth-16));card.style.width=`${width}px`;card.style.left=`${Math.max(8,Math.min(x+36-width,innerWidth-width-8))-x}px`;
      card.classList.toggle('below',y<240);card.style.maxHeight=`${Math.max(80,y<240?innerHeight-y-62:y-16)}px`;
    },
    open(){setOpen(true);},hide(){host.style.setProperty('display','none','important');setOpen(false);},owns(element){return element===host;}
  };
})();
