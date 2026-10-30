import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Session } from './db';
const key = () => { const secret=process.env.SESSION_SECRET; if(!secret || secret.length<32) throw new Error('Set SESSION_SECRET to at least 32 characters'); return new TextEncoder().encode(secret); };
export async function sign(data: Record<string, unknown>, age: string) { return new SignJWT(data).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime(age).sign(key()); }
export async function verify(token:string) { try { return (await jwtVerify(token,key(),{algorithms:['HS256']})).payload; } catch { return null; } }
export async function createSession(session:Session) { (await cookies()).set('session',await sign({...session},'7d'),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800}); }
export async function getSession():Promise<Session|null> { const token=(await cookies()).get('session')?.value; if(!token)return null; const p=await verify(token); return p && typeof p.userId==='number' && typeof p.username==='string' ? {userId:p.userId,username:p.username}:null; }
export async function deleteSession(){ (await cookies()).delete('session'); }
