/* Pure mapping helpers. No document edits or network access. */
(() => {
  function normalize(text){let value='',offsets=[];for(let i=0;i<text.length;i++){const c=/\s|\u00a0/.test(text[i])?' ':text[i];if(c===' '&&(!value||value.endsWith(' ')))continue;value+=c;offsets.push(i);}if(value.endsWith(' ')){value=value.slice(0,-1);offsets.pop();}return {value,offsets};}
  function occurrences(text,needle){if(!needle)return [];const found=[];let at=text.indexOf(needle);while(at>=0&&found.length<2){found.push(at);at=text.indexOf(needle,at+1);}return found;}
  function layout(input,measure){
    const runs=input.filter(r=>r&&typeof r.text==='string'&&r.text.length<=24000&&[r.x,r.y,r.top,r.bottom,r.width,r.sx,r.ratioX,r.ratioY,r.canvasLeft,r.canvasTop].every(Number.isFinite)&&r.ratioX>0&&r.ratioY>0&&r.sx>0).map(r=>({...r,left:r.canvasLeft+r.x*r.ratioX,right:r.canvasLeft+(r.x+r.width)*r.ratioX,baseline:r.canvasTop+r.y*r.ratioY,top:r.canvasTop+r.top*r.ratioY,bottom:r.canvasTop+r.bottom*r.ratioY}));
    runs.sort((a,b)=>a.baseline-b.baseline||a.left-b.left);
    const unique=[];for(const r of runs){if(!unique.some(s=>s.text===r.text&&Math.abs(s.left-r.left)<.5&&Math.abs(s.baseline-r.baseline)<.5))unique.push(r);}
    const rows=[];for(const r of unique){let row=rows.find(row=>Math.abs(row.baseline-r.baseline)<2);if(!row){row={baseline:r.baseline,runs:[]};rows.push(row);}row.runs.push(r);}rows.sort((a,b)=>a.baseline-b.baseline);
    let raw='',map=[],previous=null;
    for(const row of rows){row.runs.sort((a,b)=>a.left-b.left);for(const r of row.runs){
      if(previous&&(Math.abs(previous.baseline-r.baseline)>=2||r.left-previous.right>1.5)&&!raw.endsWith(' ')&&!/^\s/.test(r.text)){raw+=' ';map.push(null);}
      const index=unique.indexOf(r);for(let i=0;i<r.text.length;i++){raw+=r.text[i];map.push({run:index,char:i});}previous=r;
    }}
    const normalized=normalize(raw);return {text:normalized.value,map:normalized.offsets.map(i=>map[i]),runs:unique,measure};
  }
  function project(anchor,suggestions,input,measure){
    if(!anchor?.unique)return {marks:[],reason:'This paragraph repeats in the document. Use sidebar corrections.'};
    if(typeof anchor.full!=='string'||!Number.isInteger(anchor.start)||anchor.start<0)return {marks:[],reason:'No checked passage is connected.'};
    const view=layout(input,measure),full=normalize(anchor.full),matches=occurrences(view.text,full.value);
    if(!view.runs.length)return {marks:[],reason:'No canvas text captured. Reload Docs. If this persists, use sidebar edits; this renderer is unsupported.'};
    if(matches.length!==1)return {marks:[],reason:matches.length?'Rendered text is ambiguous. Use sidebar corrections.':'Checked paragraph is not fully rendered. Scroll it into view.'};
    const origin=matches[0],marks=[];
    suggestions.forEach((edit,index)=>{
      const start=anchor.start+edit.start,end=anchor.start+edit.end;
      if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>anchor.full.length||anchor.full.slice(start,end)!==edit.original)return;
      const positions=full.offsets.map((offset,i)=>offset>=start&&offset<end?i:-1).filter(i=>i>=0),groups=[];
      for(const position of positions){const mapped=view.map[origin+position];if(!mapped)continue;const last=groups[groups.length-1];if(last&&last.run===mapped.run&&last.end===mapped.char)last.end=mapped.char+1;else groups.push({run:mapped.run,start:mapped.char,end:mapped.char+1});}
      for(const group of groups){const r=view.runs[group.run],left=r.left+measure(r,r.text.slice(0,group.start))*r.sx*r.ratioX,right=r.left+measure(r,r.text.slice(0,group.end))*r.sx*r.ratioX;
        if(![left,right,r.bottom,r.top].every(Number.isFinite)||right<=left||r.clip&&(left<r.clip.left-1||right>r.clip.right+1||r.bottom>r.clip.bottom+1||r.top<r.clip.top-1))continue;
        marks.push({index,left,right,top:r.top,bottom:r.bottom});
      }
    });return {marks,reason:marks.length?`${suggestions.length} suggestions mapped to the document.`:'No inline errors in this check.'};
  }
  globalThis.QuillDocsGeometry={normalize,occurrences,layout,project};
})();
