import type {NextConfig} from 'next';
const config:NextConfig={distDir:process.env.NEXT_TEST_BUILD==='1'?'.next-test':'.next'};
export default config;
