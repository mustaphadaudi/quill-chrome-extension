(() => {
  const blocks=new Set(['DIV','P','LI','UL','OL','PRE','H1','H2','H3','BLOCKQUOTE']);
  function resolve(element){
    if(!(element instanceof HTMLElement)||element.closest('[inert]'))return null;
    if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement){
      if(element.disabled||element.readOnly||/password|cc-|one-time-code|email|tel|username/i.test(element.autocomplete||''))return null;
      return element instanceof HTMLTextAreaElement||['text','search'].includes(element.type)?element:null;
    }
    if(!element.isContentEditable)return null;
    let field=element;
    while(field.parentElement?.isContentEditable)field=field.parentElement;
    if(field.getAttribute('aria-readonly')==='true'||field.closest('[contenteditable="false"]'))return null;
    return field;
  }
  function stream(field){
    let text='';const segments=[];
    function add(value,start,end,node=null){if(!value)return;segments.push({from:text.length,to:text.length+value.length,start,end,node});text+=value;}
    function walk(node){
      if(node.nodeType===3){add(node.data,{node,offset:0},{node,offset:node.data.length},node);return;}
      if(node.nodeType!==1||['SCRIPT','STYLE'].includes(node.nodeName))return;
      const children=Array.from(node.childNodes);
      children.forEach((child,index)=>{
        const before={node,offset:index},after={node,offset:index+1};
        if(child.nodeName==='BR')add('\n',before,after);
        else{if(blocks.has(child.nodeName)&&text&&!text.endsWith('\n'))add('\n',before,before);walk(child);if(blocks.has(child.nodeName)&&index<children.length-1&&!text.endsWith('\n'))add('\n',after,after);}
      });
    }
    walk(field);return {text,segments};
  }
  const plain=field=>field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement;
  function read(field){return plain(field)?field.value:stream(field).text;}
  function point(data,offset){
    for(const part of data.segments){if(offset>=part.from&&offset<=part.to)return part.node?{node:part.node,offset:offset-part.from}:offset===part.from?part.start:part.end;}
    return data.segments.at(-1)?.end;
  }
  function range(field,start,end){
    const data=stream(field),r=document.createRange();
    const a=point(data,start)||{node:field,offset:0},b=point(data,end)||{node:field,offset:0};r.setStart(a.node,a.offset);r.setEnd(b.node,b.offset);return r;
  }
  function offset(field,node,position){
    const target=document.createRange();target.selectNodeContents(field);target.setEnd(node,position);
    const container=document.createElement('div');container.append(target.cloneContents());return stream(container).text.length;
  }
  function snapshot(field){
    const full=read(field);let start=0,end=full.length;
    if(plain(field)){const a=field.selectionStart||0,b=field.selectionEnd||0;if(a!==b){start=a;end=b;}}
    else{
      const selection=field.getRootNode().getSelection?.()||document.getSelection();
      if(selection?.rangeCount){const selected=selection.getRangeAt(0);if(!selected.collapsed&&field.contains(selected.startContainer)&&field.contains(selected.endContainer)){start=offset(field,selected.startContainer,selected.startOffset);end=offset(field,selected.endContainer,selected.endOffset);}}
    }
    return {field,full,start,end,text:full.slice(start,end)};
  }
  function replace(field,start,end,text){
    if(!field.isConnected||resolve(field)!==field)throw new Error('This field is no longer editable.');
    const before=read(field),expected=before.slice(0,start)+text+before.slice(end);
    if(plain(field)){
      const proto=field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(field,expected);
      field.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:null}));
      field.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
      const r=range(field,start,end);field.focus();const selection=field.getRootNode().getSelection?.()||document.getSelection();selection.removeAllRanges();selection.addRange(r);
      // Chrome's native editing command preserves editor input events and its undo stack.
      // Never fall back to replacing innerHTML, which would destroy rich-text structure.
      if(!document.execCommand('insertText',false,text))throw new Error('This editor rejected the edit. Use the writing pad instead.');
    }
    if(read(field)!==expected)throw new Error('This editor transformed the edit. Review its text; use its native undo if needed.');
  }
  function undo(field,record){if(plain(field)){replace(field,0,read(field).length,record.before);return;}field.focus();for(let n=0;n<Math.max(1,record.undoStates?.length||1);n++){if(!document.execCommand('undo'))break;const current=read(field);if(current===record.before)return;if(!record.undoStates?.includes(current))break;}throw new Error('This editor cannot undo that change automatically. Use its native undo.');}
  globalThis.QuillEditors={resolve,read,snapshot,replace,undo};
})();
