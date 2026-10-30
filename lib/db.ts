import Database from 'better-sqlite3';
import path from 'node:path';
export type Priority='high'|'medium'|'low';
export type RecurrencePattern='daily'|'weekly'|'monthly'|'yearly';
export type ReminderMinutes=15|30|60|120|1440|2880|10080;
export interface Session {userId:number; username:string}
export interface User {id:number; username:string; created_at:string}
export interface Authenticator {id:number; user_id:number; credential_id:string; credential_public_key:Buffer; counter:number; created_at:string}
export interface Subtask {id:number; todo_id:number; title:string; completed:boolean; position:number; created_at:string}
export interface Tag {id:number; user_id:number; name:string; color:string; created_at:string}
export interface Todo {id:number; user_id:number; title:string; completed:boolean; due_date:string|null; priority:Priority; is_recurring:boolean; recurrence_pattern:RecurrencePattern|null; reminder_minutes:number|null; last_notification_sent:string|null; created_at:string; updated_at:string|null; subtasks:Subtask[]; tags:Tag[]}
export interface Template {id:number; user_id:number; name:string; description:string|null; category:string|null; title_template:string; priority:Priority; is_recurring:boolean; recurrence_pattern:RecurrencePattern|null; reminder_minutes:number|null; due_date_offset_minutes:number|null; subtasks_json:string|null; created_at:string}
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
CREATE TABLE IF NOT EXISTS subtasks (id INTEGER PRIMARY KEY AUTOINCREMENT,todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,title TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,position INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,color TEXT NOT NULL DEFAULT '#3B82F6',created_at TEXT NOT NULL DEFAULT (datetime('now')),UNIQUE(user_id,name));
CREATE TABLE IF NOT EXISTS todo_tags (todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,PRIMARY KEY(todo_id,tag_id));
CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT,category TEXT,title_template TEXT NOT NULL,priority TEXT NOT NULL DEFAULT 'medium',is_recurring INTEGER NOT NULL DEFAULT 0,recurrence_pattern TEXT,reminder_minutes INTEGER,due_date_offset_minutes INTEGER,subtasks_json TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS holidays (id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now'))); CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);`);
type Row=Record<string, unknown>;
export function getTodo(id:number,userId:number):Todo|undefined { const row=db.prepare('SELECT * FROM todos WHERE id=? AND user_id=?').get(id,userId) as Row|undefined; if(!row)return; return {...row,completed:!!row.completed,is_recurring:!!row.is_recurring,subtasks:(db.prepare('SELECT * FROM subtasks WHERE todo_id=? ORDER BY position,id').all(id) as Row[]).map(s=>({...s,completed:!!s.completed})),tags:db.prepare('SELECT tags.* FROM tags JOIN todo_tags ON tags.id=todo_tags.tag_id WHERE todo_tags.todo_id=? ORDER BY tags.name').all(id)} as unknown as Todo; }
export function getTodos(userId:number):Todo[] { return (db.prepare('SELECT id FROM todos WHERE user_id=?').all(userId) as {id:number}[]).map(r=>getTodo(r.id,userId)!); }
