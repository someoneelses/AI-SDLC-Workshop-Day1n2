'use client';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <main className="auth-wrap"><div className="auth-card"><h1>Something went wrong.</h1><p className="muted">Please try again. Your saved tasks are still in your account.</p><button onClick={reset}>Try again</button></div></main>}
