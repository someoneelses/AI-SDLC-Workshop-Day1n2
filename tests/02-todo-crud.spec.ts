import {test,expect} from '@playwright/test';import {register} from './helpers';
test('create, complete and delete a task in the UI',async({page})=>{await register(page);await page.getByLabel('Task title').fill('Buy groceries');await page.getByRole('button',{name:'Add task'}).click();await expect(page.getByText('Buy groceries')).toBeVisible();await page.getByLabel('Complete Buy groceries').check();await expect(page.getByRole('heading',{name:/Completed/})).toBeVisible();await page.getByTitle('Delete task').click();await expect(page.getByText('Buy groceries')).toHaveCount(0)});

