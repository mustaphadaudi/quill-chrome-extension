(() => {
  // Preserve exact, non-overlapping suggestions after accepted edits change offsets.
  function rebase(before, after, remaining, accepted) {
    const edits=[...accepted].sort((a,b)=>a.start-b.start);
    let expected=before,last=before.length;
    for(const edit of [...edits].reverse()){
      if(!Number.isInteger(edit.start)||!Number.isInteger(edit.end)||edit.start<0||edit.end<=edit.start||edit.end>last||before.slice(edit.start,edit.end)!==edit.original)throw new Error('The text changed. Check it again.');
      expected=expected.slice(0,edit.start)+edit.replacement+expected.slice(edit.end);last=edit.start;
    }
    if(expected!==after)throw new Error('The editor changed the text unexpectedly. Check it again.');
    return remaining.flatMap(item=>{
      if(edits.some(edit=>item.start<edit.end&&item.end>edit.start))return [];
      const delta=edits.filter(edit=>edit.end<=item.start).reduce((sum,edit)=>sum+edit.replacement.length-(edit.end-edit.start),0);
      const next={...item,start:item.start+delta,end:item.end+delta};
      return after.slice(next.start,next.end)===next.original?[next]:[];
    });
  }
  globalThis.QuillSuggestions={rebase};
})();
