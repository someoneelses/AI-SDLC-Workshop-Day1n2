import {test,expect} from '@playwright/test';import {register,createTodo} from './helpers';
test('priority is persisted and invalid priorities are rejected',async({page})=>{await register(page);const t=await createTodo(page,'Priority task',{priority:'high'});expect(t.priority).toBe('high');expect((await page.request.post('/api/todos',{data:{title:'Bad',priority:'urgent'}})).status()).toBe(400)});
