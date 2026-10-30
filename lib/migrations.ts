import type Database from 'better-sqlite3';
/** Apply additive upgrades atomically so existing tasks and reminders remain intact. */
export function migrateTodoColumns(db:Database.Database){
  db.transaction(()=>{
    const columns=db.pragma('table_info(todos)') as {name:string}[];
    if(!columns.some(c=>c.name==='notification_claim_token'))db.exec('ALTER TABLE todos ADD COLUMN notification_claim_token TEXT');
    if(!columns.some(c=>c.name==='notification_claimed_at'))db.exec('ALTER TABLE todos ADD COLUMN notification_claimed_at INTEGER');
    if(!columns.some(c=>c.name==='completed_at')){
      db.exec('ALTER TABLE todos ADD COLUMN completed_at TEXT');
      db.exec("UPDATE todos SET completed_at=COALESCE(updated_at,created_at) WHERE completed=1");
    }
  }).immediate();
}
