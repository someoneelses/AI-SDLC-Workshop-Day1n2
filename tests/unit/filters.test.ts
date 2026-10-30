import test from 'node:test';
import assert from 'node:assert/strict';
import {applyFilters,groupTodos,initialFilters,progress,parseStoredFilters} from '../../lib/filters';
import type {Todo} from '../../lib/db';
import {readableTagText} from '../../lib/color';
const task={id:1,user_id:1,title:'Prepare meeting',completed:false,due_date:'2026-12-01T09:00',priority:'high',is_recurring:false,recurrence_pattern:null,reminder_minutes:null,last_notification_sent:null,created_at:'2026-01-01',updated_at:null,completed_at:null,subtasks:[{id:1,todo_id:1,title:'Send report',completed:false,position:0,created_at:''}],tags:[{id:1,user_id:1,name:'Finance',color:'#123456',created_at:''}]} satisfies Todo;
test('search includes titles, subtasks and tags regardless of case',()=>{for(const search of ['MEETING','report','FINANCE'])assert.equal(applyFilters([task],{...initialFilters,search}).length,1)});
test('filters combine with AND and handle dates and missing due dates',()=>{assert.equal(applyFilters([task],{...initialFilters,priority:'high',tagId:'1',completion:'false',dueDateFrom:'2026-12-01',dueDateTo:'2026-12-01'}).length,1);assert.equal(applyFilters([task],{...initialFilters,priority:'low',tagId:'1'}).length,0);assert.equal(applyFilters([{...task,due_date:null}],{...initialFilters,dueDateFrom:'2026-01-01'}).length,0)});
test('progress reaches 100 only when every subtask is complete',()=>{assert.equal(progress(0,0),0);assert.equal(progress(1,2),50);assert.equal(progress(199,200),99);assert.equal(progress(2,2),100)});
test('stored filters reject corrupted or unsupported values',()=>{assert.deepEqual(parseStoredFilters('{invalid'),initialFilters);const result=parseStoredFilters(JSON.stringify({search:'report',priority:'urgent',tagId:'nope',completion:'true'}));assert.equal(result.search,'report');assert.equal(result.priority,'');assert.equal(result.tagId,'');assert.equal(result.completion,'true')});
test('date filters use the Singapore calendar date for offset timestamps',()=>{const offset={...task,due_date:'2099-02-15T17:30:00Z'};assert.equal(applyFilters([offset],{...initialFilters,dueDateFrom:'2099-02-16',dueDateTo:'2099-02-16'}).length,1)});
test('tag text chooses the higher-contrast color',()=>{assert.equal(readableTagText('#ffffff'),'#000000');assert.equal(readableTagText('#000000'),'#ffffff');assert.equal(readableTagText('#3B82F6'),'#000000')});
test('task groups preserve priority, due-date and completion ordering',()=>{
  const tasks:Todo[]=[
    {...task,id:1,due_date:'2026-11-30T09:00',priority:'low'},
    {...task,id:2,due_date:'2026-11-29T09:00',priority:'high'},
    {...task,id:3,due_date:null,priority:'high'},
    {...task,id:4,due_date:'2026-12-01T09:00',priority:'high'},
    {...task,id:5,due_date:'2026-12-02T09:00',priority:'medium'},
    {...task,id:6,completed:true,completed_at:'2026-11-29 00:00:00'},
    {...task,id:7,completed:true,completed_at:'2026-11-30 00:00:00'},
    {...task,id:8,due_date:'invalid'},
    {...task,id:9,due_date:'2026-12-01T01:00:00Z',priority:'high'},
  ];
  const groups=groupTodos(tasks,Date.parse('2026-12-01T01:00:00Z'));
  assert.deepEqual(groups.map(group=>group.name),['Overdue','Pending','Completed']);
  assert.deepEqual(groups.map(group=>group.rows.map(todo=>todo.id)),[[2,1],[9,4,3,5],[7,6]]);
});
