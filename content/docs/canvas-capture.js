/* MAIN-world, document_start. Observes drawing; never edits the Docs renderer. */
(() => {
  if(window.top!==window||globalThis.__quillCanvasCapture)return;
  globalThis.__quillCanvasCapture=true;
  const stores=new WeakMap(),visible=new Set();let revision=0,notice=0;
  const point=(m,x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
  const changed=()=>{revision++;if(!notice)notice=requestAnimationFrame(()=>{notice=0;window.postMessage({source:'quill-canvas',type:'changed',revision},location.origin);});};
  function records(canvas){let state=stores.get(canvas);if(!state){state={width:canvas.width,height:canvas.height,runs:[]};stores.set(canvas,state);}if(state.width!==canvas.width||state.height!==canvas.height){state.width=canvas.width;state.height=canvas.height;state.runs=[];}if(canvas instanceof HTMLCanvasElement)visible.add(canvas);return state.runs;}
  function add(canvas,run){const list=records(canvas),key=[run.x,run.y,run.font,run.text].join('|');run.key=key;const existing=list.findIndex(item=>item.key===key||Math.abs(item.x-run.x)<.1&&Math.abs(item.y-run.y)<.1);if(existing>=0)list.splice(existing,1);list.push(run);if(list.length>2000)list.splice(0,list.length-2000);changed();}
  function text(ctx,args){
    const value=String(args[0]),x=Number(args[1]),y=Number(args[2]);if(!value||value.length>24000||![x,y].every(Number.isFinite)||ctx.globalAlpha===0||ctx.direction==='rtl')return;
    const m=ctx.getTransform();if(Math.abs(m.b)>0.001||Math.abs(m.c)>0.001||m.a<=0||m.d<=0)return;
    const metrics=ctx.measureText(value),width=metrics.width;if(!width)return;
    const scale=args[3]&&args[3]<width?args[3]/width:1;
    let left=x;if(ctx.textAlign==='center')left-=width*scale/2;else if(ctx.textAlign==='right'||ctx.textAlign==='end')left-=width*scale;
    const size=parseFloat(ctx.font.match(/([\d.]+)px/)?.[1]||'14');
    const ascent=metrics.actualBoundingBoxAscent||size*.8,descent=metrics.actualBoundingBoxDescent||size*.2;
    const origin=point(m,left,y),top=point(m,left,y-ascent),bottom=point(m,left,y+descent);
    add(ctx.canvas,{text:value,font:ctx.font,x:origin.x,y:origin.y,top:top.y,bottom:bottom.y,sx:m.a*scale,sy:m.d,width:width*m.a*scale,kern:ctx.fontKerning||'auto',letterSpacing:ctx.letterSpacing||'0px',wordSpacing:ctx.wordSpacing||'0px',align:ctx.textAlign});
  }
  function patch(proto,name,observe){const original=proto?.[name];if(typeof original!=='function')return;proto[name]=function(...args){const result=Reflect.apply(original,this,args);try{if(this.canvas.getRootNode?.().host?.id!=='quill-docs-overlay')observe(this,args);}catch{}return result;};}
  for(const proto of [globalThis.CanvasRenderingContext2D?.prototype,globalThis.OffscreenCanvasRenderingContext2D?.prototype]){
    patch(proto,'fillText',text);
    patch(proto,'clearRect',(ctx,args)=>{
      const m=ctx.getTransform(),a=point(m,args[0],args[1]),b=point(m,args[0]+args[2],args[1]+args[3]);
      const left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y),list=records(ctx.canvas);
      for(let i=list.length-1;i>=0;i--){const r=list[i];if(r.x<right&&r.x+r.width>left&&r.top<bottom&&r.bottom>top)list.splice(i,1);}changed();
    });
    patch(proto,'fillRect',(ctx,args)=>{
      if(ctx.globalAlpha!==1||!['source-over','copy'].includes(ctx.globalCompositeOperation))return;
      const color=String(ctx.fillStyle);if(!/^#[0-9a-f]{6}$/i.test(color)&&!/^rgb\(/.test(color))return;
      const m=ctx.getTransform();if(Math.abs(m.b)>0.001||Math.abs(m.c)>0.001)return;
      const a=point(m,args[0],args[1]),b=point(m,args[0]+args[2],args[1]+args[3]),list=records(ctx.canvas);
      for(let i=list.length-1;i>=0;i--){const r=list[i];if(r.x<Math.max(a.x,b.x)&&r.x+r.width>Math.min(a.x,b.x)&&r.top<Math.max(a.y,b.y)&&r.bottom>Math.min(a.y,b.y))list.splice(i,1);}changed();
    });
    patch(proto,'reset',ctx=>{records(ctx.canvas).splice(0);changed();});
    patch(proto,'drawImage',(ctx,args)=>{
      const source=args[0],input=stores.get(source);if(!input?.runs.length)return;
      let sx=0,sy=0,sw=source.width,sh=source.height,dx,dy,dw,dh;
      if(args.length===3){[dx,dy]=args.slice(1);dw=sw;dh=sh;}else if(args.length===5){[dx,dy,dw,dh]=args.slice(1);}else if(args.length===9){[sx,sy,sw,sh,dx,dy,dw,dh]=args.slice(1);}else return;
      const m=ctx.getTransform();if(Math.abs(m.b)>0.001||Math.abs(m.c)>0.001||sw<=0||sh<=0||dw<=0||dh<=0||m.a<=0||m.d<=0)return;
      const ax=dw/sw*m.a,ay=dh/sh*m.d;
      for(const r of [...input.runs]){if(r.x<sx||r.x+r.width>sx+sw||r.top<sy||r.bottom>sy+sh)continue;const p=point(m,dx+(r.x-sx)*dw/sw,dy+(r.y-sy)*dh/sh);const t=point(m,dx,dy+(r.top-sy)*dh/sh),b=point(m,dx,dy+(r.bottom-sy)*dh/sh);add(ctx.canvas,{...r,x:p.x,y:p.y,top:t.y,bottom:b.y,sx:r.sx*ax,sy:r.sy*ay,width:r.width*ax});}
    });
  }
  for(const proto of [globalThis.HTMLCanvasElement?.prototype,globalThis.OffscreenCanvas?.prototype])for(const name of ['width','height']){
    const descriptor=proto&&Object.getOwnPropertyDescriptor(proto,name);if(!descriptor?.set||!descriptor.configurable)continue;
    Object.defineProperty(proto,name,{...descriptor,set(value){Reflect.apply(descriptor.set,this,[value]);stores.delete(this);if(this.getRootNode?.().host?.id!=='quill-docs-overlay')changed();}});
  }
  window.addEventListener('message',event=>{
    const data=event.data;if(event.source!==window||event.origin!==location.origin||data?.source!=='quill-overlay'||data.type!=='snapshot'||typeof data.id!=='string'||data.id.length>80)return;
    const runs=[];let chars=0;
    for(const canvas of visible){
      if(!canvas.isConnected){visible.delete(canvas);continue;}
      if(!canvas.matches('canvas.kix-canvas-tile-content,.kix-page canvas,.kix-canvas-tile-content canvas'))continue;
      const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height||!canvas.width||!canvas.height)continue;
      for(const r of records(canvas)){if(chars+r.text.length>100000||runs.length>=3000)break;chars+=r.text.length;runs.push({...r,canvasLeft:rect.left,canvasTop:rect.top,ratioX:rect.width/canvas.width,ratioY:rect.height/canvas.height,clip:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}});}
    }
    window.postMessage({source:'quill-canvas',type:'snapshot',id:data.id,revision,runs},location.origin);
  });
})();
