'use client';
import {useCallback,useEffect,useState} from 'react';
import type {Todo} from '../db';
type ClaimedTodo=Todo & {notification_claim_token:string};
type PendingClaim={body:string;shown:boolean};
export function useNotifications(){
  const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('default');
  useEffect(()=>{queueMicrotask(()=>setPermission('Notification' in window?Notification.permission:'unsupported'))},[]);
  const enable=useCallback(async()=>{if(!('Notification' in window)){setPermission('unsupported');return}setPermission(await Notification.requestPermission())},[]);
  useEffect(()=>{if(permission!=='granted')return;let active=true;const pending=new Map<string,PendingClaim>();
    const settle=(claim:PendingClaim)=>fetch('/api/notifications/check',{method:claim.shown?'POST':'DELETE',headers:{'Content-Type':'application/json'},body:claim.body,keepalive:true});
    const check=async()=>{try{const response=await fetch('/api/notifications/check');if(!response.ok)return;const todos:ClaimedTodo[]=await response.json();for(const todo of todos){const claim:PendingClaim={body:JSON.stringify({todoId:todo.id,token:todo.notification_claim_token}),shown:false};pending.set(todo.notification_claim_token,claim);try{if(active){const notification=new Notification('Task reminder',{body:todo.title,requireInteraction:true,tag:`todo-${todo.id}`});claim.shown=true;notification.onclick=()=>{window.focus();notification.close()}}await settle(claim)}catch{if(!claim.shown){try{await settle(claim)}catch{/* The lease permits a later retry. */}}}finally{pending.delete(todo.notification_claim_token)}}}catch{/* Retry when the next poll is due. */}};
    void check();const timer=setInterval(check,30000);return()=>{active=false;clearInterval(timer);for(const claim of pending.values())void settle(claim).catch(()=>{})};
  },[permission]);
  return {permission,enable};
}
