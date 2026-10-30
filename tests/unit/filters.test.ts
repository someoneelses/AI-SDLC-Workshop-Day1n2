import test from 'node:test';
import assert from 'node:assert/strict';
import {applyFilters,initialFilters,progress} from '../../lib/filters';
import type {Todo} from '../../lib/db';
const task={id:1,user_id:1,title:'Prepare meeting',completed:false,due_date:'2026-12-01T09:00',priority:'high',is_recurring:false,recurrence_pattern:null,reminder_minutes:null,last_notification_sent:null,created_at:'2026-01-01',updated_at:null,subtasks:[{id:1,todo_id:1,title:'Send report',completed:false,position:0,created_at:''}],tags:[{id:1,user_id:1,name:'Finance',color:'#123456',created_at:''}]} satisfies Todo;
test('search includes titles, subtasks and tags regardless of case',()=>{for(const search of ['MEETING','report','FINANCE'])assert.equal(applyFilters([task],{...initialFilters,search}).length,1)});
test('filters combine with AND and handle dates and missing due dates',()=>{assert.equal(applyFilters([task],{...initialFilters,priority:'high',tagId:'1',completion:'false',dueDateFrom:'2026-12-01',dueDateTo:'2026-12-01'}).length,1);assert.equal(applyFilters([task],{...initialFilters,priority:'low',tagId:'1'}).length,0);assert.equal(applyFilters([{...task,due_date:null}],{...initialFilters,dueDateFrom:'2026-01-01'}).length,0)});
test('progress reaches 100 only when every subtask is complete',()=>{assert.equal(progress(0,0),0);assert.equal(progress(1,2),50);assert.equal(progress(199,200),99);assert.equal(progress(2,2),100)});
