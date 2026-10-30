import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
export async function middleware(req:NextRequest) { const token=req.cookies.get('session')?.value; let valid=false; if(token && process.env.SESSION_SECRET) { try { const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.SESSION_SECRET),{algorithms:['HS256']}); valid=typeof payload.userId==='number'; } catch {} } if(!valid && req.nextUrl.pathname!=='/login')return NextResponse.redirect(new URL('/login',req.url)); if(valid && req.nextUrl.pathname==='/login')return NextResponse.redirect(new URL('/',req.url)); return NextResponse.next(); }
export const config={matcher:['/','/calendar','/login']};
