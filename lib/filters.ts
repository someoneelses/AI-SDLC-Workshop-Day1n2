import type {Todo} from './db';
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
    if(filters.dueDateFrom && (!todo.due_date || todo.due_date.slice(0,10)<filters.dueDateFrom))return false;
    if(filters.dueDateTo && (!todo.due_date || todo.due_date.slice(0,10)>filters.dueDateTo))return false;
    return true;
  });
}
export function progress(completed:number,total:number):number{return total?Math.floor(completed/total*100):0}
