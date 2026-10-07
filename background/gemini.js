import { MODES } from '../shared/settings.js';
import { RESPONSE_SCHEMA, instructions } from './prompts.js';
export const MAX_TEXT = 12000;
export function validateRequest(text, mode) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Write some text first.');
  if (text.length > MAX_TEXT) throw new Error(`Select a shorter passage: the current request limit is ${MAX_TEXT.toLocaleString()} characters. Nothing was truncated or sent.`);
  if (!MODES.includes(mode)) throw new Error('Unknown writing action.');
}
export function validateResult(data, text, mode) {
  if (!data || typeof data.summary !== 'string' || typeof data.tone !== 'string' || !Array.isArray(data.suggestions) || typeof data.rewrite !== 'string') throw new Error('Gemini returned an invalid result. Please try again.');
  const result = {summary: data.summary.slice(0,400), tone: data.tone.slice(0,100), rewrite: '', suggestions: []};
  if (mode !== 'check') {
    if (!data.rewrite.trim() || data.rewrite.length > MAX_TEXT * 3) throw new Error('Gemini returned an invalid rewrite.');
    result.rewrite = data.rewrite;
    return result;
  }
  if (data.suggestions.length > 20) throw new Error('Gemini returned too many edits. Please check a shorter passage.');
  for (const item of data.suggestions) {
    if (!item || typeof item.original !== 'string' || !item.original || typeof item.replacement !== 'string' || item.replacement.length > MAX_TEXT || typeof item.explanation !== 'string' || !['spelling','grammar','style'].includes(item.category) || !Number.isInteger(item.occurrence) || item.occurrence < 0 || item.occurrence > text.length) throw new Error('Gemini returned an invalid edit. Please try again.');
    let start = -1, cursor = 0;
    for (let n = 0; n <= item.occurrence; n++) {
      start = text.indexOf(item.original, cursor);
      if (start < 0) throw new Error('A suggestion did not match your text. Please check again.');
      cursor = start + item.original.length;
    }
    if (item.original !== item.replacement) result.suggestions.push({...item, start, end: cursor, explanation: item.explanation.slice(0,400)});
  }
  result.suggestions.sort((a,b) => a.start-b.start);
  for (let i = 1; i < result.suggestions.length; i++) if (result.suggestions[i].start < result.suggestions[i-1].end) throw new Error('Gemini returned overlapping suggestions. Please try again.');
  return result;
}
export function applyEdits(text, suggestions) {
  const edits = [...suggestions].sort((a,b) => b.start-a.start);
  let last = text.length;
  for (const edit of edits) {
    if (!Number.isInteger(edit.start) || !Number.isInteger(edit.end) || edit.start < 0 || edit.end > last || text.slice(edit.start, edit.end) !== edit.original) throw new Error('The text changed. Check it again before applying.');
    text = text.slice(0,edit.start) + edit.replacement + text.slice(edit.end);
    last = edit.start;
  }
  return text;
}
async function apiError(response, apiKey, model, source='') {
  let detail='';
  try {
    const body=await response.json();
    const message=typeof body.error?.message==='string'?body.error.message:'';
    const status=typeof body.error?.status==='string'?body.error.status:'';
    detail=[status,message].filter(Boolean).join(': ');
  } catch {}
  detail=detail.split(apiKey).join('[key removed]');
  if(source)detail=detail.split(source).join('[writing removed]');
  detail=detail.replace(/AIza[\w-]+/g,'[key removed]').replace(/[\x00-\x1f]/g,' ').slice(0,1200);
  const hint=response.status===429?'Gemini quota reached. Check your free allowance in AI Studio.':
    response.status===404?'This Gemini model is unavailable. In settings try gemini-3.5-flash-lite, save and test.':
    [400,401,403].includes(response.status)?'Gemini rejected the request. Check your key and project access.':
    'Gemini is temporarily unavailable. Try again later.';
  const error=new Error(`${hint} [HTTP ${response.status}; ${model}; v1beta]${detail?' '+detail:''}`);
  error.quota=response.status===429;return error;
}
export async function generate({text, mode, settings, apiKey, fetcher = fetch}) {
  validateRequest(text, mode);
  if (!apiKey) throw new Error('Add your Gemini API key in Quill settings first.');
  let response;
  try {
    response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`, {
      method: 'POST', headers: {'Content-Type':'application/json','x-goog-api-key':apiKey},
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({systemInstruction:{parts:[{text: instructions(mode,settings.language)}]},contents:[{role:'user',parts:[{text: JSON.stringify({mode,source:text})}]}],generationConfig:{temperature:settings.model.startsWith('gemini-3')?1:0.2,maxOutputTokens:8192,responseMimeType:'application/json',responseSchema:RESPONSE_SCHEMA}})
    });
  } catch { throw new Error('Gemini could not be reached or timed out. Your text has not been changed.'); }
  if (!response.ok) throw await apiError(response,apiKey,settings.model,text);
  const body = await response.json();
  const candidate = body.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('Gemini did not finish the response. Try a shorter passage.');
  let data;
  try { data = JSON.parse(candidate.content.parts.filter(part => !part.thought).map(part => part.text || '').join('')); }
  catch { throw new Error('Gemini returned an unreadable response. Please try again.'); }
  return validateResult(data, text, mode);
}

export async function listModels(apiKey, fetcher=fetch) {
  if(!apiKey)throw new Error('Save your API key first.');
  const available=[];let token='';
  do {
    const url=new URL('https://generativelanguage.googleapis.com/v1beta/models');url.searchParams.set('pageSize','1000');if(token)url.searchParams.set('pageToken',token);
    let response;try{response=await fetcher(url.href,{headers:{'x-goog-api-key':apiKey},signal:AbortSignal.timeout(15000)});}catch{throw new Error('Could not reach Gemini to load models.');}
    if(!response.ok)throw await apiError(response,apiKey,'models.list');
    const body=await response.json();
    for(const model of body.models||[])if(model.supportedGenerationMethods?.includes('generateContent')&&/^models\/gemini-[a-z0-9.-]+$/.test(model.name)&&/flash/.test(model.name)&&!/image|audio|tts|live|robotics/.test(model.name))available.push({id:model.name.slice(7),name:model.displayName||model.name.slice(7)});
    token=body.nextPageToken||'';
  }while(token);
  return available;
}
