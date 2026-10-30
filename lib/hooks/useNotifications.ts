'use client';
import {useEffect} from 'react';
import type {Todo} from '../db';
/** Poll only when the browser has permission. The check endpoint atomically records each delivery. */
export function useNotifications(){useEffect(()=>{if(!('Notification' in window))return;const check=async()=>{if(Notification.permission!=='granted')return;try{const response=await fetch('/api/notifications/check');if(!response.ok)return;const todos:Todo[]=await response.json();todos.forEach(todo=>new Notification('Task reminder',{body:todo.title}));}catch{ /* Retry at the next interval. */ }};void check();const timer=setInterval(check,30000);return()=>clearInterval(timer)},[])}
