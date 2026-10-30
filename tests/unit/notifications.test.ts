import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_PATH=':memory:';

test('notification claims filter, isolate, hydrate and retry due tasks',async()=>{
  const {db,claimDueNotifications,getTodos}=await import('../../lib/db');
  try{
    const owner=Number(db.prepare('INSERT INTO users(username) VALUES(?)').run('reminder-owner').lastInsertRowid);
    const other=Number(db.prepare('INSERT INTO users(username) VALUES(?)').run('reminder-other').lastInsertRowid);
    const insert=db.prepare('INSERT INTO todos(user_id,title,due_date,reminder_minutes,completed,last_notification_sent) VALUES(?,?,?,?,?,?)');
    const add=(user:number,title:string,due:string,minutes:number|null=15,completed=0,sent:string|null=null)=>Number(insert.run(user,title,due,minutes,completed,sent).lastInsertRowid);
    const due=add(owner,'Due','2026-07-01T08:10');
    const start=add(owner,'At reminder start','2026-07-01T08:15');
    const deadline=add(owner,'At deadline','2026-07-01T00:00:00Z');
    const early=add(owner,'Too early','2026-07-01T08:16');
    add(owner,'Overdue','2026-07-01T07:59');
    add(owner,'Completed','2026-07-01T08:10',15,1);
    add(owner,'Already sent','2026-07-01T08:10',15,0,'2026-07-01T00:00:00Z');
    add(owner,'No reminder','2026-07-01T08:10',null);
    add(owner,'Invalid date','invalid');
    const privateTask=add(other,'Other user','2026-07-01T08:10');
    const tag=Number(db.prepare('INSERT INTO tags(user_id,name) VALUES(?,?)').run(owner,'Work').lastInsertRowid);
    db.prepare('INSERT INTO todo_tags(todo_id,tag_id) VALUES(?,?)').run(due,tag);
    db.prepare('INSERT INTO subtasks(todo_id,title,position) VALUES(?,?,?)').run(due,'Step',0);
    assert.deepEqual(getTodos(owner,[due,privateTask]).map(t=>t.id),[due]);
    assert.deepEqual(getTodos(owner,[]),[]);

    const now=new Date('2026-07-01T00:00:00Z');
    const claimed=claimDueNotifications(owner,now);
    assert.deepEqual(claimed.map(t=>t.id),[due,start,deadline]);
    assert.equal(claimed[0].tags[0].name,'Work');
    assert.equal(claimed[0].subtasks[0].title,'Step');
    assert.match(claimed[0].notification_claim_token,/^[0-9a-f-]{36}$/);
    assert.deepEqual(claimDueNotifications(owner,now),[]);
    assert.deepEqual(claimDueNotifications(other,now).map(t=>t.id),[privateTask]);

    const retry=claimDueNotifications(owner,new Date(now.getTime()+120001));
    assert.deepEqual(retry.map(t=>t.id),[due,start,early]);
    assert.notEqual(retry[0].notification_claim_token,claimed[0].notification_claim_token);
  }finally{db.close()}
});
