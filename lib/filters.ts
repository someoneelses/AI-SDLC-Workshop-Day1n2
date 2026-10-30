import type {Todo} from './db';
import {parseSingapore,singaporeDateKey} from './timezone';
export type Filters={search:string;priority:string;tagId:string;completion:string;dueDateFrom:string;dueDateTo:string};
export const initialFilters:Filters={search:'',priority:'',tagId:'',completion:'',dueDateFrom:'',dueDateTo:''};
/** Apply every selected filter with AND semantics, including title, subtask, and tag search. */
export function applyFilters(todos:Todo[],filters:Filters):Todo[]{
  const search=filters.search.trim().toLocaleLowerCase();
  return todos.filter(todo=>{
    if(search && !todo.title.toLocaleLowerCase().includes(search) && !todo.subtasks.some(s=>s.title.toLocaleLowerCase().includes(search)) && !todo.tags.some(t=>t.name.toLocaleLowerCase().includes(search)))return false;
    if(filters.priority && todo.priority!==filters.priority)return false;
    if(filters.tagId && !todo.tags.some(t=>String(t.id)===filters.tagId))return false;
    if(filters.completion && String(todo.completed)!==filters.completion)return false;
    const dueDate=(filters.dueDateFrom||filters.dueDateTo)&&todo.due_date?singaporeDateKey(todo.due_date):null;
    if(filters.dueDateFrom && (!dueDate || dueDate<filters.dueDateFrom))return false;
    if(filters.dueDateTo && (!dueDate || dueDate>filters.dueDateTo))return false;
    return true;
  });
}
/** Classify tasks once, then sort without reparsing dates for each comparison. */
export function groupTodos(todos:Todo[],now:number){
  const overdue:Todo[]=[],pending:Todo[]=[],completed:Todo[]=[];
  const dueTimes=new Map<Todo,number>();
  for(const todo of todos){
    if(todo.completed){completed.push(todo);continue}
    const due=todo.due_date?parseSingapore(todo.due_date).getTime():Infinity;
    dueTimes.set(todo,due);
    if(due<now)overdue.push(todo);
    else if(due>=now)pending.push(todo);
  }
  const rank={high:0,medium:1,low:2};
  const sort=(a:Todo,b:Todo)=>rank[a.priority]-rank[b.priority]||(dueTimes.get(a)!-dueTimes.get(b)!)||b.created_at.localeCompare(a.created_at)||b.id-a.id;
  overdue.sort(sort);pending.sort(sort);
  completed.sort((a,b)=>(b.completed_at||b.updated_at||b.created_at).localeCompare(a.completed_at||a.updated_at||a.created_at)||b.id-a.id);
  return [{name:'Overdue',rows:overdue},{name:'Pending',rows:pending},{name:'Completed',rows:completed}];
}
export function progress(completed:number,total:number):number{return total?Math.floor(completed/total*100):0}
export function activeFilterKey(userId:number){return `todo-app:active-filters:${userId}`}
export function parseStoredFilters(raw:string|null):Filters {
  try {
    const data=JSON.parse(raw||'null') as Partial<Filters>|null;if(!data||typeof data!=='object')return {...initialFilters};
    return {search:typeof data.search==='string'?data.search.slice(0,500):'',priority:['high','medium','low'].includes(data.priority||'')?data.priority!:'',tagId:/^\d+$/.test(data.tagId||'')?data.tagId!:'',completion:['true','false'].includes(data.completion||'')?data.completion!:'',dueDateFrom:/^\d{4}-\d{2}-\d{2}$/.test(data.dueDateFrom||'')?data.dueDateFrom!:'',dueDateTo:/^\d{4}-\d{2}-\d{2}$/.test(data.dueDateTo||'')?data.dueDateTo!:''};
  }catch{return {...initialFilters}}
}
