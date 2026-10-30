import {performance} from 'node:perf_hooks';
import {applyFilters,groupTodos,initialFilters} from '../lib/filters';
import type {Todo} from '../lib/db';

// Synthetic, in-process measurements: no server, browser, or real user database.
const todos:Todo[]=Array.from({length:1000},(_,i)=>({
  id:i+1,user_id:1,title:`Task ${i} report`,completed:i%5===0,
  due_date:i%11===0?null:`2026-${String(i%12+1).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}T09:00:00Z`,
  priority:(['high','medium','low'] as const)[i%3],is_recurring:false,recurrence_pattern:null,
  reminder_minutes:null,last_notification_sent:null,created_at:'2026-01-01 00:00:00',updated_at:null,completed_at:null,
  subtasks:[{id:i+1,todo_id:i+1,title:`Step ${i}`,completed:false,position:0,created_at:'2026-01-01 00:00:00'}],
  tags:[{id:1,user_id:1,name:'Work',color:'#3B82F6',created_at:'2026-01-01 00:00:00'}],
}));
const filters={...initialFilters,search:'report',dueDateFrom:'2026-01-01',dueDateTo:'2026-12-31'};
function measure(label:string,fn:()=>unknown){
  for(let i=0;i<5;i++)fn();
  const samples=Array.from({length:30},()=>{const start=performance.now();fn();return performance.now()-start}).sort((a,b)=>a-b);
  const average=samples.reduce((total,sample)=>total+sample,0)/samples.length;
  console.log(`${label}: mean ${average.toFixed(2)} ms, median ${samples[15].toFixed(2)} ms, p95 ${samples[28].toFixed(2)} ms (30 runs)`);
}
const now=Date.parse('2026-07-01T00:00:00Z');
measure('Filter 1,000 tasks',()=>applyFilters(todos,filters));
measure('Group and sort 1,000 tasks',()=>groupTodos(todos,now));
measure('Filter, group and sort 1,000 tasks',()=>groupTodos(applyFilters(todos,filters),now));

async function benchmarkDatabase(){
  // The database module reads this path at import time. All fixture data stays in memory.
  process.env.DATABASE_PATH=':memory:';
  const {db,getTodos}=await import('../lib/db');
  try{
    const userId=Number(db.prepare('INSERT INTO users(username) VALUES(?)').run('benchmark-user').lastInsertRowid);
    const tagId=Number(db.prepare('INSERT INTO tags(user_id,name) VALUES(?,?)').run(userId,'Work').lastInsertRowid);
    const insertTodo=db.prepare('INSERT INTO todos(user_id,title,due_date,priority) VALUES(?,?,?,?)');
    const insertSubtask=db.prepare('INSERT INTO subtasks(todo_id,title,position) VALUES(?,?,?)');
    const insertTag=db.prepare('INSERT INTO todo_tags(todo_id,tag_id) VALUES(?,?)');
    db.transaction(()=>{for(let i=0;i<10000;i++){
      const todoId=Number(insertTodo.run(userId,`Task ${i}`,'2026-12-01T09:00','medium').lastInsertRowid);
      insertSubtask.run(todoId,'Step',0);insertTag.run(todoId,tagId);
    }})();
    if(getTodos(userId).length!==10000)throw new Error('Benchmark fixture could not be read');
    measure('Read 10,000 tasks with subtasks and tags from in-memory SQLite',()=>getTodos(userId));
    const pageCount=db.pragma('page_count',{simple:true}) as number;
    const pageSize=db.pragma('page_size',{simple:true}) as number;
    console.log(`In-memory SQLite logical size: ${(pageCount*pageSize/1024/1024).toFixed(2)} MiB (10,000 tasks, subtasks and tags)`);
  }finally{db.close()}
}
benchmarkDatabase().catch(error=>{console.error(error);process.exitCode=1});
