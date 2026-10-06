import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

import {
	inlineToolbar,
	isPressed,
	openEditor,
	selectText,
	setValue,
	shortValue,
	toolbarButton,
	value
} from './helpers';

const BUTTONS = ['bold', 'image', 'qrcode', 'source'];

const form = (page: Page) => page.locator('.jodit-qrcode');

async function insertQr(page: Page, text: string): Promise<void> {
	await toolbarButton(page, 'qrcode').click();
	await form(page).locator('textarea').fill(text);
	await expect(form(page).locator('.jodit-qrcode__preview img')).toBeVisible();
	await form(page).locator('button[type=submit]').click();
	await expect(form(page)).toBeHidden();
}

test.describe('QR code', () => {
	test('adds its button to the default toolbar', async ({ page }) => {
		await openEditor(page);
		await expect(toolbarButton(page, 'qrcode')).toBeVisible();
	});

	test('inserts a QR code with a live preview', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertQr(page, 'https://example.com/');

		expect(await shortValue(page)).toBe(
			'<p><img src="data:image/png;base64,…" alt="https://example.com/" ' +
				'data-qrcode="https://example.com/" width="200" height="200"></p>'
		);
	});

	test('opens with the selected text and keeps the text', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p>Visit https://example.com/</p>');
		await selectText(page, 'https://example.com/');

		await toolbarButton(page, 'qrcode').click();
		await expect(form(page).locator('textarea')).toHaveValue(
			'https://example.com/'
		);
		await form(page).locator('button[type=submit]').click();

		expect(await shortValue(page)).toMatch(
			/^<p>Visit https:\/\/example\.com\/<img [^>]*data-qrcode="https:\/\/example\.com\/"/
		);
	});

	test('shows an error for a text that does not fit', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'qrcode').click();
		await form(page).locator('textarea').fill('x'.repeat(5000));

		await expect(form(page).locator('.jodit-qrcode__preview')).toHaveText(
			'Could not create a QR code: the text is too long'
		);
		await form(page).locator('button[type=submit]').click();
		await expect(form(page)).toBeVisible();
		expect(await value(page)).not.toContain('<img');
	});

	test('applies the format, size and class options', async ({ page }) => {
		await openEditor(page, {
			buttons: BUTTONS,
			qrcode: { format: 'svg', size: 120, className: 'qr framed' }
		});
		await insertQr(page, 'hello');

		const html = await value(page);
		expect(html).toContain('src="data:image/svg+xml;charset=utf-8,');
		expect(html).toContain('width="120" height="120"');
		expect(html).toContain('class="qr framed"');
	});

	test('edits a code in place and keeps its size', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertQr(page, 'first');
		await page.evaluate(() =>
			window.editor.editor.querySelector('img').setAttribute('width', '90')
		);

		// Selected without a click: the inline image toolbar would cover the
		// main toolbar
		await page.evaluate(() =>
			window.editor.s.select(window.editor.editor.querySelector('img'))
		);
		await toolbarButton(page, 'qrcode').click();
		await expect(form(page).locator('textarea')).toHaveValue('first');
		await expect(form(page).locator('button[type=submit]')).toHaveText(
			'Update'
		);
		await form(page).locator('textarea').fill('second');
		await form(page).locator('button[type=submit]').click();

		const html = await shortValue(page);
		expect(html.match(/<img/g)).toHaveLength(1);
		expect(html).toContain('data-qrcode="second"');
		expect(html).toContain('width="90"');
	});

	test('double click opens the QR code dialog, not image properties', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertQr(page, 'code');

		await page.locator('.jodit-wysiwyg img').dblclick();
		await expect(form(page).locator('textarea')).toHaveValue('code');
		await expect(page.locator('.jodit-dialog_active_true')).toHaveCount(0);
	});

	test('double click on a regular image still opens its properties', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p><img src="/tests/e2e/pixel.svg" width="40"></p>');

		await page.locator('.jodit-wysiwyg img').dblclick();
		await expect(
			page.locator('.jodit-dialog_active_true .jodit-dialog__panel')
		).toBeVisible();
		await expect(form(page)).toHaveCount(0);
	});

	test('takes over the image tools on QR codes only', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p><img src="/tests/e2e/pixel.svg" width="40"> </p>');
		await page.evaluate(() =>
			window.editor.s.setCursorIn(window.editor.editor.querySelector('p'), false)
		);
		await insertQr(page, 'code');

		await page.locator('.jodit-wysiwyg img:not([data-qrcode])').click();
		await expect.poll(() => inlineToolbar(page)).toContain('pencil');
		await expect.poll(() => isPressed(page, 'image')).toBe(true);
		await expect.poll(() => isPressed(page, 'qrcode')).toBe(false);

		await page.locator('.jodit-wysiwyg img[data-qrcode]').click();
		await expect.poll(() => inlineToolbar(page)).toContain('qrcode');
		expect(await inlineToolbar(page)).not.toContain('pencil');
		await expect.poll(() => isPressed(page, 'image')).toBe(false);
		await expect.poll(() => isPressed(page, 'qrcode')).toBe(true);

		await page.locator('.jodit-popup .jodit-toolbar-button_qrcode button').click();
		await expect(form(page).locator('textarea')).toHaveValue('code');
	});

	test('leaves QR codes to the image tools when disabled', async ({ page }) => {
		// The default toolbar: a button listed in `buttons` is shown even when
		// its plugin is disabled
		await openEditor(page, { disablePlugins: ['qrcode'] });
		await setValue(
			page,
			'<p><img src="/tests/e2e/pixel.svg" data-qrcode="x" width="40"></p>'
		);

		await expect(toolbarButton(page, 'image')).toBeVisible();
		await expect(toolbarButton(page, 'qrcode')).toHaveCount(0);
		await page.locator('.jodit-wysiwyg img').click();
		await expect.poll(() => inlineToolbar(page)).toContain('pencil');
		await expect.poll(() => isPressed(page, 'image')).toBe(true);

		await page.locator('.jodit-wysiwyg img').dblclick();
		await expect(
			page.locator('.jodit-dialog_active_true .jodit-dialog__panel')
		).toBeVisible();
	});

	test('follows the language option', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS, language: 'ru' });
		await toolbarButton(page, 'qrcode').click();

		await expect(form(page)).toContainText('Текст или ссылка');
		await expect(form(page).locator('button[type=submit]')).toHaveText(
			'Вставить'
		);
	});
});
