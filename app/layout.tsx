import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Daybook', description: 'A thoughtful place for your tasks' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
