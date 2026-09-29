import { loadContent, saveContent } from './repository'
import type { ContentItem } from './types'
const items=new Map<string,ContentItem>(); let hydrated=false
export async function hydrateContent(){ if(hydrated)return; hydrated=true; for(const x of await loadContent())items.set(x.id,x) }
export function listContent(){return [...items.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
export async function createContent(input:Omit<ContentItem,'id'|'createdAt'|'updatedAt'>){const now=new Date().toISOString();const item={...input,id:`content_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,createdAt:now,updatedAt:now};items.set(item.id,item);await saveContent(item);return item}
export async function patchContent(id:string,patch:Partial<ContentItem>){const item=items.get(id);if(!item)return null;const next={...item,...patch,updatedAt:new Date().toISOString()};items.set(id,next);await saveContent(next);return next}
