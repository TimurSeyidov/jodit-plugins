import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

import { openEditor, shortValue, toolbarButton } from './helpers';

/** Inserts a QR code and an email link through the dialogs */
async function insertBoth(page: Page): Promise<void> {
	await toolbarButton(page, 'qrcode').click();
	await page.locator('.jodit-qrcode textarea').fill('https://example.com/');
	await expect(page.locator('.jodit-qrcode__preview img')).toBeVisible();
	await page.locator('.jodit-qrcode button[type=submit]').click();
	await expect(page.locator('.jodit-qrcode')).toBeHidden();

	await toolbarButton(page, 'mailto').click();
	await page
		.locator('.jodit-mailto [name="to"]')
		.locator('visible=true')
		.fill('a@x.com');
	await page.locator('.jodit-mailto button[type=submit]').click();
	await expect(page.locator('.jodit-mailto')).toBeHidden();

	expect(await shortValue(page)).toBe(
		'<p><img src="data:image/png;base64,…" alt="https://example.com/" data-qrcode="https://example.com/" ' +
			'width="200" height="200"><a href="mailto:a@x.com">a@x.com</a></p>'
	);
}

test.describe('Builds', () => {
	for (const build of ['es2015', 'es2018', 'es2021']) {
		test(`${build}: the plugins work with the same build of Jodit`, async ({
			page
		}) => {
			const errors: string[] = [];
			page.on('pageerror', error => errors.push(error.message));

			await openEditor(page, { buttons: ['qrcode', 'mailto'] }, { build });
			await insertBoth(page);
			expect(errors).toEqual([]);
		});
	}

	test('extraPlugins loads the plugins from basePath', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', request => {
			if (request.url().includes('/plugins/')) {
				requests.push(new URL(request.url()).pathname);
			}
		});

		await openEditor(
			page,
			{
				basePath: '/bundle/es2021/',
				extraPlugins: ['qrcode', 'mailto'],
				buttons: ['qrcode', 'mailto']
			},
			{ plugins: [] }
		);

		await expect(toolbarButton(page, 'qrcode')).toBeVisible();
		await expect(toolbarButton(page, 'mailto')).toBeVisible();
		expect(requests.sort()).toEqual([
			'/bundle/es2021/plugins/mailto/mailto.min.js',
			'/bundle/es2021/plugins/qrcode/qrcode.min.js'
		]);
		await insertBoth(page);
	});

	test('extraPlugins loads the plugins from a URL', async ({ page }) => {
		await openEditor(
			page,
			{
				extraPlugins: ['qrcode', 'mailto'].map(name => ({
					name,
					url: `/packages/${name}/dist/es2018/plugins/${name}/${name}.js`
				})),
				buttons: ['qrcode', 'mailto']
			},
			{ plugins: [] }
		);

		await insertBoth(page);
	});

	test('a plugin loaded twice is registered once', async ({ page }) => {
		await openEditor(page, { buttons: ['qrcode', 'mailto'] });

		// Options the plugins wrap when they are registered
		await page.evaluate(() => {
			const o = window.Jodit.defaultOptions;
			window.saved = [o.popup.a, o.popup.img, o.controls.link, o.controls.image];
		});

		await page.addScriptTag({
			url: '/bundle/es2021/plugins/qrcode/qrcode.min.js'
		});
		await page.addScriptTag({
			url: '/bundle/es2021/plugins/mailto/mailto.min.js'
		});

		// The second copy does not register or wrap anything again
		const unchanged = await page.evaluate(() => {
			const o = window.Jodit.defaultOptions;
			return [o.popup.a, o.popup.img, o.controls.link, o.controls.image].every(
				(item, index) => item === window.saved?.[index]
			);
		});
		expect(unchanged).toBe(true);

		await page.evaluate(() => {
			window.editor.destruct();
			window.editor = window.Jodit.make('#editor', {
				language: 'en',
				buttons: ['qrcode', 'mailto']
			});
		});

		await insertBoth(page);
	});
});
