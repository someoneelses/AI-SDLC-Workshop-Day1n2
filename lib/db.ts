import Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {migrateTodoColumns} from './migrations';
import {parseSingapore} from './timezone';
export type Priority='high'|'medium'|'low';
export type RecurrencePattern='daily'|'weekly'|'monthly'|'yearly';
export type ReminderMinutes=15|30|60|120|1440|2880|10080;
export interface Session {userId:number; username:string}
export interface User {id:number; username:string; created_at:string}
export interface Authenticator {id:number; user_id:number; credential_id:string; credential_public_key:Buffer; counter:number; created_at:string}
export interface Subtask {id:number; todo_id:number; title:string; completed:boolean; position:number; created_at:string}
export interface Tag {id:number; user_id:number; name:string; color:string; created_at:string}
export interface Todo {id:number; user_id:number; title:string; completed:boolean; due_date:string|null; priority:Priority; is_recurring:boolean; recurrence_pattern:RecurrencePattern|null; reminder_minutes:number|null; last_notification_sent:string|null; created_at:string; updated_at:string|null; completed_at:string|null; subtasks:Subtask[]; tags:Tag[]}
export interface Template {id:number; user_id:number; name:string; description:string|null; category:string|null; title_template:string; priority:Priority; is_recurring:boolean; recurrence_pattern:RecurrencePattern|null; reminder_minutes:number|null; due_date_offset_minutes:number|null; subtasks_json:string|null; tagIds:number[]; created_at:string}
export interface Holiday {id:number; date:string; name:string}
const globalDb=globalThis as typeof globalThis & {workshopDb?:Database.Database};
export const db=globalDb.workshopDb ?? new Database(process.env.DATABASE_PATH || path.join(process.cwd(),'todos.db'));
if(process.env.NODE_ENV!=='production') globalDb.workshopDb=db;
db.pragma('foreign_keys = ON'); db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS authenticators (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,credential_id TEXT UNIQUE NOT NULL,credential_public_key BLOB NOT NULL,counter INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,due_date TEXT,priority TEXT NOT NULL DEFAULT 'medium',is_recurring INTEGER NOT NULL DEFAULT 0,recurrence_pattern TEXT,reminder_minutes INTEGER,last_notification_sent TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id); CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_due ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_pending_reminders ON todos(user_id, due_date) WHERE completed=0 AND reminder_minutes IS NOT NULL AND last_notification_sent IS NULL;
CREATE TABLE IF NOT EXISTS subtasks (id INTEGER PRIMARY KEY AUTOINCREMENT,todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,title TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,position INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,color TEXT NOT NULL DEFAULT '#3B82F6',created_at TEXT NOT NULL DEFAULT (datetime('now')),UNIQUE(user_id,name));
CREATE TABLE IF NOT EXISTS todo_tags (todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,PRIMARY KEY(todo_id,tag_id));
CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT,category TEXT,title_template TEXT NOT NULL,priority TEXT NOT NULL DEFAULT 'medium',is_recurring INTEGER NOT NULL DEFAULT 0,recurrence_pattern TEXT,reminder_minutes INTEGER,due_date_offset_minutes INTEGER,subtasks_json TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE TABLE IF NOT EXISTS template_tags (template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,PRIMARY KEY(template_id,tag_id));
CREATE INDEX IF NOT EXISTS idx_template_tags_tag_id ON template_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
CREATE TABLE IF NOT EXISTS holidays (id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now'))); CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);`);
migrateTodoColumns(db);
type Row=Record<string, unknown>;
export function getTodo(id:number,userId:number):Todo|undefined { const row=db.prepare('SELECT * FROM todos WHERE id=? AND user_id=?').get(id,userId) as Row|undefined; if(!row)return; return {...row,completed:!!row.completed,is_recurring:!!row.is_recurring,subtasks:(db.prepare('SELECT * FROM subtasks WHERE todo_id=? ORDER BY position,id').all(id) as Row[]).map(s=>({...s,completed:!!s.completed})),tags:db.prepare('SELECT tags.* FROM tags JOIN todo_tags ON tags.id=todo_tags.tag_id WHERE todo_tags.todo_id=? ORDER BY tags.name').all(id)} as unknown as Todo; }
export function getTodos(userId:number,ids?:number[]):Todo[] {
  // Read relationships in batches so loading N tasks does not issue N additional queries.
  if(ids&&ids.length===0)return [];
  const selected=ids?JSON.stringify(ids):null;
  const selection=selected?' AND t.id IN (SELECT value FROM json_each(?))':'';
  const rows=db.prepare('SELECT t.* FROM todos t WHERE t.user_id=?'+selection+' ORDER BY t.id').all(...(selected?[userId,selected]:[userId])) as Row[];
  const subtasks=db.prepare('SELECT s.* FROM subtasks s JOIN todos t ON t.id=s.todo_id WHERE t.user_id=?'+selection+' ORDER BY s.position,s.id').all(...(selected?[userId,selected]:[userId])) as Row[];
  const tags=db.prepare('SELECT tt.todo_id, tags.* FROM todo_tags tt JOIN todos t ON t.id=tt.todo_id JOIN tags ON tags.id=tt.tag_id WHERE t.user_id=? AND tags.user_id=?'+selection+' ORDER BY tags.name').all(...(selected?[userId,userId,selected]:[userId,userId])) as Row[];
  const byId=new Map<number,Todo>();
  for(const row of rows) byId.set(row.id as number,{...row,completed:!!row.completed,is_recurring:!!row.is_recurring,subtasks:[],tags:[]} as unknown as Todo);
  for(const row of subtasks){const todo=byId.get(row.todo_id as number);if(todo)todo.subtasks.push({...row,completed:!!row.completed} as unknown as Subtask)}
  for(const row of tags){const todo=byId.get(row.todo_id as number);if(todo){const {todo_id,...tag}=row;void todo_id;todo.tags.push(tag as unknown as Tag)}}
  return [...byId.values()];
}

/** Claim due reminders atomically and hydrate only claimed tasks and their relationships. */
export function claimDueNotifications(userId:number,now:Date):(Todo & {notification_claim_token:string})[]{
  return db.transaction(()=>{
    const candidates=db.prepare('SELECT id,due_date,reminder_minutes FROM todos WHERE user_id=? AND completed=0 AND due_date IS NOT NULL AND reminder_minutes IS NOT NULL AND last_notification_sent IS NULL ORDER BY id').all(userId) as {id:number;due_date:string;reminder_minutes:number}[];
    const nowMs=now.getTime();
    const claims=new Map<number,string>();
    const update=db.prepare('UPDATE todos SET notification_claim_token=?,notification_claimed_at=? WHERE id=? AND user_id=? AND last_notification_sent IS NULL AND (notification_claimed_at IS NULL OR notification_claimed_at<?)');
    for(const todo of candidates){
      if(!todo.reminder_minutes)continue;
      const due=parseSingapore(todo.due_date).getTime();
      if(!(nowMs>=due-todo.reminder_minutes*60000&&nowMs<=due))continue;
      const token=randomUUID();
      if(update.run(token,nowMs,todo.id,userId,nowMs-120000).changes)claims.set(todo.id,token);
    }
    return getTodos(userId,[...claims.keys()]).map(todo=>({...todo,notification_claim_token:claims.get(todo.id)!}));
  }).immediate();
}
