'use client';
import {useEffect,useRef} from 'react';
export default function Modal({title,children,onClose,error}:{title:string;children:React.ReactNode;onClose:()=>void;error?:string}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const el=ref.current;const first=el?.querySelector<HTMLElement>('button,input,select,textarea,[tabindex]:not([tabindex="-1"])');first?.focus();return()=>previous?.focus()},[]);
  return <div className="overlay" onClick={onClose}><div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose()}if(e.key==='Tab'){const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')||[]);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}}><div className="dialog-head"><h2>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>{error&&<div className="error" role="alert">{error}</div>}{children}</div></div>;
}
