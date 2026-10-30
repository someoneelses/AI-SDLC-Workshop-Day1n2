import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {migrateTodoColumns} from '../../lib/migrations';
test('legacy tasks are preserved when schema upgrades are repeated',()=>{const db=new Database(':memory:');try{db.exec("CREATE TABLE todos(id INTEGER PRIMARY KEY,title TEXT,completed INTEGER,created_at TEXT,updated_at TEXT); INSERT INTO todos VALUES(1,'Completed',1,'2020-01-01 00:00:00','2021-02-03 12:00:00'); INSERT INTO todos VALUES(2,'Pending',0,'2022-01-01 00:00:00',NULL)");migrateTodoColumns(db);migrateTodoColumns(db);const rows=db.prepare('SELECT * FROM todos ORDER BY id').all() as {title:string;completed_at:string|null;notification_claim_token:string|null}[];assert.equal(rows[0].title,'Completed');assert.equal(rows[0].completed_at,'2021-02-03 12:00:00');assert.equal(rows[1].title,'Pending');assert.equal(rows[1].completed_at,null);assert.equal(rows[0].notification_claim_token,null)}finally{db.close()}});
