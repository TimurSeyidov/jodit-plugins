import { readFileSync } from 'node:fs';

import { expect, test } from './fixtures';
import type { FrameLocator, Locator, Page, Route } from '@playwright/test';

import { openEditor, placeCaret, setValue, toolbarButton, value } from './helpers';

/** A few real records of every collection of dummyjson.com */
const FIXTURES: Record<string, Array<Record<string, unknown>>> = JSON.parse(
	readFileSync(new URL('../../packages/datagen/test/fixtures.json', import.meta.url), 'utf8')
);

const POSTS = FIXTURES.posts.map(post => post.title as string);
const PRODUCTS = FIXTURES.products.map(product => product.title as string);

const PIXEL = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64'
);

const CORS = { 'access-control-allow-origin': '*' };

/**
 * Answers dummyjson.com with the fixtures, and its images with a pixel, without the network. `reply` replaces the
 * answer of the collections. Returns the URLs of the collections asked for.
 */
async function mockService(
	page: Page,
	reply?: (route: Route, resource: string) => Promise<void>
): Promise<string[]> {
	const asked: string[] = [];

	await page.route('https://dummyjson.com/**', route => {
		const url = new URL(route.request().url());

		if (url.pathname.startsWith('/image/') || url.pathname.startsWith('/icon/')) {
			return route.fulfill({ body: PIXEL, contentType: 'image/png' });
		}

		const resource = url.pathname.slice(1);
		asked.push(url.pathname + url.search);

		return reply
			? reply(route, resource)
			: route.fulfill({ json: { [resource]: FIXTURES[resource] ?? [] }, headers: CORS });
	});

	return asked;
}

const dialog = (page: Page): Locator => page.locator('.jodit-datagen-dialog .jodit-dialog__panel');
const field = (page: Page, name: string): Locator => dialog(page).locator(`[name="${name}"]`);
const preview = (page: Page): FrameLocator => page.frameLocator('.jodit-datagen__preview');
const insertButton = (page: Page): Locator => dialog(page).locator('.jodit-ui-button_insert');
const tab = (page: Page, title: string): Locator =>
	dialog(page).locator('.jodit-tabs__button').filter({ hasText: title });
const problems = (page: Page): Locator => dialog(page).locator('.jodit-datagen__problem');
const status = (page: Page): Locator => dialog(page).locator('.jodit-datagen__status');

async function open(page: Page, options: Record<string, unknown> = {}): Promise<void> {
	await openEditor(page, { buttons: ['bold', 'datagen'], ...options }, { plugins: ['datagen'] });
	await page.evaluate(() => localStorage.clear());
}

async function openDialog(page: Page): Promise<void> {
	await toolbarButton(page, 'datagen').click();
	await expect(dialog(page)).toBeVisible();
	await expect(status(page)).toHaveText('');
}

/** Titles of the posts in the editor, in their order */
const postTitles = (html: string): string[] => [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map(match => match[1]);

test.describe('Data generation', () => {
	test('inserts posts with the first layout, as many as the collection has', async ({ page }) => {
		const asked = await mockService(page);
		await open(page);
		await openDialog(page);

		await expect(field(page, 'type')).toHaveValue('posts');
		await expect(field(page, 'layout')).toHaveValue('articles');
		// 5 by default, but the collection has 3 records
		await expect(field(page, 'count')).toHaveValue('3');
		await expect(dialog(page)).toContainText('1 to 3');
		await expect(preview(page).locator('h2')).toHaveCount(3);
		await expect(dialog(page)).toContainText('it cannot be generated again');
		expect(asked).toEqual(['/posts?limit=0&select=title,body,tags,reactions,views']);

		await insertButton(page).click();
		await expect(dialog(page)).toBeHidden();

		const html = await value(page);
		expect(postTitles(html).sort()).toEqual([...POSTS].sort());
		// In place of the empty paragraph, with a paragraph to go on typing; no traces of the plugin
		expect(html).toMatch(/^<h2>[\s\S]*<\/p><p><br><\/p>$/);
		expect(html).not.toContain('data-');
		expect(html).not.toContain('{{');
	});

	test('inserts what the preview shows', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);

		const shown = await preview(page).locator('h2').allTextContents();
		await insertButton(page).click();

		expect(postTitles(await value(page))).toEqual(shown);
	});

	test('changes the type, the number and the layout', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);

		await field(page, 'type').selectOption('products');
		await expect(field(page, 'layout')).toHaveValue('cards');
		await expect(preview(page).locator('h3')).toHaveCount(3);

		await field(page, 'layout').selectOption('table');
		await expect(preview(page).locator('tbody tr')).toHaveCount(3);
		// The product without a brand
		await expect(preview(page).locator('tbody')).toContainText('—');

		await field(page, 'count').fill('2');
		await expect(preview(page).locator('tbody tr')).toHaveCount(2);

		await insertButton(page).click();

		const html = await value(page);
		expect(html.match(/<tr>/g)).toHaveLength(3);
		expect(PRODUCTS.filter(title => html.includes(title))).toHaveLength(2);
		expect(html).toContain('<th>Brand</th>');
	});

	test('shuffles the records', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await field(page, 'count').fill('1');
		await expect(preview(page).locator('h2')).toHaveCount(1);

		const seen = new Set<string>();

		for (let attempt = 0; attempt < 30 && seen.size < 2; attempt += 1) {
			await dialog(page).locator('.jodit-ui-button_shuffle').click();
			await expect(status(page)).toHaveText('');
			seen.add((await preview(page).locator('h2').textContent()) ?? '');
		}

		expect(seen.size).toBe(2);
	});

	test('own template: problems stop the insertion until they are fixed', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await tab(page, 'Template').click();

		const item = field(page, 'item');
		await expect(item).toHaveValue('<h2>{{title}}</h2><p>{{body}}</p>');

		await item.fill('<li>{{titel}} — {{tags|lu}}</li>');
		await field(page, 'before').fill('<ul>');
		await field(page, 'after').fill('</ul');

		await expect(field(page, 'layout')).toHaveValue('custom');
		await expect(problems(page)).toHaveText([
			'Item: Unknown field titel',
			'Item: Unknown filter lu',
			'<ul> is not closed'
		]);
		await expect(insertButton(page)).toBeDisabled();

		// A problem selects its placeholder
		await problems(page).first().click();
		expect(
			await item.evaluate((area: HTMLTextAreaElement) =>
				area.value.slice(area.selectionStart, area.selectionEnd)
			)
		).toBe('{{titel}}');

		await item.fill('<li>{{title}} — {{tags|join: / }}</li>');
		// Only a warning about the tags: </ul is not a tag
		await expect(problems(page)).toHaveText(['<ul> is not closed']);
		await expect(dialog(page).locator('.jodit-datagen__problem_warning')).toHaveCount(1);
		await expect(insertButton(page)).toBeEnabled();

		await field(page, 'after').fill('</ul>');
		await expect(problems(page)).toHaveCount(0);
		await expect(preview(page).locator('li')).toHaveCount(3);

		await insertButton(page).click();

		const html = await value(page);
		expect(html).toMatch(/^<ul>(<li>[^<]+ — [^<]+<\/li>){3}<\/ul>/);
		expect(html).toContain(' / ');
	});

	test('the list of fields puts placeholders into the template', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await field(page, 'type').selectOption('order');
		await tab(page, 'Template').click();

		const fields = dialog(page).locator('.jodit-datagen__field');
		await expect(fields.filter({ hasText: '{{quantity}}' })).toContainText('Quantity, from 1 to 5');
		await expect(fields.filter({ hasText: '{{order.total}}' })).toContainText('Total of the order');

		await field(page, 'item').fill('');
		await fields.filter({ hasText: '{{title}}' }).click();
		await expect(field(page, 'item')).toHaveValue('{{title}}');

		// A field of Before and After goes to After while Item is focused
		await fields.filter({ hasText: '{{order.total}}' }).click();
		await expect(field(page, 'after')).toHaveValue(/\{\{order\.total\}\}$/);

		await field(page, 'before').fill('');
		await field(page, 'before').focus();
		await fields.filter({ hasText: '{{count}}' }).last().click();
		await expect(field(page, 'before')).toHaveValue('{{count}}');
	});

	test('a template of text and inline elements goes to the caret', async ({ page }) => {
		await mockService(page);
		await open(page);
		await setValue(page, '<p>Hello world</p>');
		await placeCaret(page, 'p', 5);
		await openDialog(page);

		await field(page, 'type').selectOption('users');
		await tab(page, 'Template').click();
		await field(page, 'before').fill('');
		await field(page, 'after').fill('');
		await field(page, 'item').fill(', <b>{{firstName}}</b>');
		await expect(preview(page).locator('b')).toHaveCount(3);

		await insertButton(page).click();

		// Jodit makes <b> <strong>
		expect(await value(page)).toMatch(/^<p>Hello(, <(b|strong)>(Emily|Michael|Sophia)<\/\2>){3} world<\/p>$/);
	});

	test('blocks go after the block of the caret', async ({ page }) => {
		await mockService(page);
		await open(page);
		await setValue(page, '<p>First</p><p>Second</p>');
		await placeCaret(page, 'p', 2);
		await openDialog(page);
		await field(page, 'type').selectOption('quotes');
		await field(page, 'count').fill('1');
		await expect(preview(page).locator('blockquote')).toHaveCount(1);

		await insertButton(page).click();

		expect(await value(page)).toMatch(/^<p>First<\/p><blockquote>[\s\S]+<\/blockquote><p>Second<\/p>$/);
	});

	test('the preview runs nothing and the inserted HTML is cleaned like any insertion', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await tab(page, 'Template').click();
		await field(page, 'item').fill(
			'<p><img src="https://dummyjson.com/image/10" onload="parent.hacked = 1" alt="{{id}}">' +
				'<a href="javascript:parent.hacked = 2">{{title}}</a></p>'
		);
		await expect(preview(page).locator('img')).toHaveCount(3);
		await page.waitForTimeout(300);
		expect(await page.evaluate(() => (window as unknown as { hacked?: number }).hacked)).toBeUndefined();

		await insertButton(page).click();
		await page.waitForTimeout(300);

		const html = await value(page);
		expect(html).not.toContain('onload');
		// Jodit makes the javascript: link harmless
		expect(html).not.toContain('href="javascript:');
		expect(await page.evaluate(() => (window as unknown as { hacked?: number }).hacked)).toBeUndefined();
	});

	test('images are made without asking the service', async ({ page }) => {
		const asked = await mockService(page);
		await open(page);
		await openDialog(page);
		await field(page, 'type').selectOption('images');
		await field(page, 'count').fill('2');
		await field(page, 'width').fill('300');
		await field(page, 'background').fill('#123456');
		await field(page, 'text').fill('Hi there');
		await expect(preview(page).locator('img')).toHaveCount(2);
		await expect(preview(page).locator('img').first()).toHaveAttribute(
			'src',
			'https://dummyjson.com/image/300x400/123456/ffffff?text=Hi%20there'
		);

		await insertButton(page).click();

		expect(await value(page)).toContain(
			'<p><img src="https://dummyjson.com/image/300x400/123456/ffffff?text=Hi%20there" alt="" width="300" height="400"></p>'
		);
		expect(asked).toEqual(['/posts?limit=0&select=title,body,tags,reactions,views']);
	});

	test('shows the failures of the service and tries again', async ({ page }) => {
		let fail = true;
		await mockService(page, (route, resource) =>
			fail
				? route.fulfill({ status: 503, body: 'Down', headers: CORS })
				: route.fulfill({ json: { [resource]: FIXTURES[resource] }, headers: CORS })
		);
		await open(page);
		await toolbarButton(page, 'datagen').click();

		await expect(status(page)).toHaveText('The data service is not available');
		await expect(insertButton(page)).toBeDisabled();

		fail = false;
		await dialog(page).locator('.jodit-ui-button_shuffle').click();
		await expect(status(page)).toHaveText('');
		await expect(preview(page).locator('h2')).toHaveCount(3);
		await expect(insertButton(page)).toBeEnabled();
	});

	test('gives up after the timeout', async ({ page }) => {
		await mockService(page, () => new Promise(() => {}));
		await open(page, { datagen: { timeout: 300 } });
		await toolbarButton(page, 'datagen').click();

		await expect(status(page)).toHaveText('The data service did not answer in time');
		await expect(insertButton(page)).toBeDisabled();
	});

	test('reports an answer that is not the collection', async ({ page }) => {
		await mockService(page, route => route.fulfill({ body: '<html>Busy</html>', headers: CORS }));
		await open(page);
		await toolbarButton(page, 'datagen').click();

		await expect(status(page)).toHaveText('The data service gave an unexpected answer');
	});

	test('remembers the choice of the last insertion', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await field(page, 'type').selectOption('products');
		await field(page, 'layout').selectOption('list');
		await field(page, 'count').fill('2');
		await expect(preview(page).locator('li')).toHaveCount(2);
		await insertButton(page).click();

		// The same page and after a reload
		for (const reload of [false, true]) {
			if (reload) {
				await page.reload();
				await page.evaluate(() => {
					window.editor = window.Jodit.make('#editor', { language: 'en', buttons: ['datagen'] });
				});
			}

			await openDialog(page);
			await expect(field(page, 'type')).toHaveValue('products');
			await expect(field(page, 'layout')).toHaveValue('list');
			await expect(field(page, 'count')).toHaveValue('2');
			await dialog(page).locator('.jodit-ui-button_cancel').click();
		}
	});

	test('remembers an own template of a type', async ({ page }) => {
		await mockService(page);
		await open(page);
		await openDialog(page);
		await tab(page, 'Template').click();
		await field(page, 'item').fill('<p>{{title}}!</p>');
		await field(page, 'before').fill('');
		await field(page, 'after').fill('');
		await expect(preview(page).locator('p')).toHaveCount(3);
		await insertButton(page).click();

		await openDialog(page);
		await expect(field(page, 'layout')).toHaveValue('custom');
		await expect(field(page, 'item')).toHaveValue('<p>{{title}}!</p>');

		// A built-in layout and back to the own template
		await field(page, 'layout').selectOption('paragraphs');
		await expect(field(page, 'item')).toHaveValue('<p>{{body}}</p>');
		await field(page, 'layout').selectOption('custom');
		await expect(field(page, 'item')).toHaveValue('<p>{{title}}!</p>');
	});

	test('remember: false keeps nothing in the browser', async ({ page }) => {
		await mockService(page);
		await open(page, { datagen: { remember: false } });
		await openDialog(page);
		await field(page, 'type').selectOption('quotes');
		await expect(preview(page).locator('blockquote')).toHaveCount(3);
		await insertButton(page).click();

		expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('datagen');
	});

	test('types and layouts of the options', async ({ page }) => {
		await mockService(page);
		await open(page, {
			datagen: {
				types: { posts: false, comments: false },
				defaultCount: 2,
				layouts: {
					names: { type: 'users', title: 'Names', before: '<p>', item: '{{fullName}}; ', after: '</p>' },
					other: { type: 'products', title: 'Not for users', before: '', item: '{{title}}', after: '' }
				}
			}
		});
		await openDialog(page);

		const types = await field(page, 'type').locator('option').evaluateAll(options =>
			options.map(option => (option as HTMLOptionElement).value)
		);
		expect(types).toEqual(['quotes', 'todos', 'users', 'products', 'reviews', 'recipes', 'order', 'images']);
		await expect(field(page, 'count')).toHaveValue('2');

		await field(page, 'type').selectOption('users');
		const layouts = await field(page, 'layout').locator('option').allTextContents();
		expect(layouts).toEqual(['Table', 'Cards', 'List', 'Names', 'Own template']);

		await field(page, 'layout').selectOption({ label: 'Names' });
		await expect(preview(page).locator('p')).toContainText('; ');
		await insertButton(page).click();

		expect(await value(page)).toMatch(/^<p>(Emily Johnson|Michael Williams|Sophia Brown); /);
	});

	test('the dialog speaks the language of the editor', async ({ page }) => {
		await mockService(page);
		await openEditor(page, { buttons: ['datagen'], language: 'ru' }, { plugins: ['datagen'] });
		await toolbarButton(page, 'datagen').click();

		await expect(dialog(page).locator('.jodit-dialog__header')).toContainText('Сгенерировать данные');
		await expect(tab(page, 'Шаблон')).toBeVisible();
		await expect(field(page, 'type').locator('option[value="posts"]')).toHaveText('Посты');
		await tab(page, 'Справка').click();
		await expect(dialog(page).locator('.jodit-datagen__help')).toContainText('Фильтры');
	});

	test('a second copy of the script registers nothing again', async ({ page }) => {
		await mockService(page);
		await open(page);
		await page.evaluate(() => {
			window.saved = [window.Jodit.defaultOptions.controls.datagen];
		});

		await page.addScriptTag({ url: '/bundle/es2021/plugins/datagen/datagen.min.js' });

		expect(
			await page.evaluate(() => window.Jodit.defaultOptions.controls.datagen === window.saved?.[0])
		).toBe(true);
		await openDialog(page);
		await expect(preview(page).locator('h2')).toHaveCount(3);
	});
});
