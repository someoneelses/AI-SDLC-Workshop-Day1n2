import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',fullyParallel:false,workers:1,timeout:30000,use:{baseURL:'http://localhost:3000',timezoneId:'Asia/Singapore',channel:'chrome',headless:true},webServer:{command:'npm run dev',url:'http://localhost:3000/login',reuseExistingServer:false,timeout:120000,env:{DATABASE_PATH:'test-todos.db'}}});
