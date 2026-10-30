'use client';
import {useCallback,useEffect,useState} from 'react';
import type {Todo} from '../db';
type ClaimedTodo=Todo & {notification_claim_token:string};
export function useNotifications(){
  const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('default');
  useEffect(()=>{queueMicrotask(()=>setPermission('Notification' in window?Notification.permission:'unsupported'))},[]);
  const enable=useCallback(async()=>{if(!('Notification' in window)){setPermission('unsupported');return}setPermission(await Notification.requestPermission())},[]);
  useEffect(()=>{if(permission!=='granted')return;let active=true;
    const check=async()=>{try{const response=await fetch('/api/notifications/check');if(!response.ok)return;const todos:ClaimedTodo[]=await response.json();for(const todo of todos){if(!active)break;const body=JSON.stringify({todoId:todo.id,token:todo.notification_claim_token});try{new Notification('Task reminder',{body:todo.title});await fetch('/api/notifications/check',{method:'POST',headers:{'Content-Type':'application/json'},body})}catch{await fetch('/api/notifications/check',{method:'DELETE',headers:{'Content-Type':'application/json'},body})}}}catch{/* Retry when the next poll is due. */}};
    void check();const timer=setInterval(check,30000);return()=>{active=false;clearInterval(timer)};
  },[permission]);
  return {permission,enable};
}
