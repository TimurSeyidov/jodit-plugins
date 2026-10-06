import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
	inlineToolbar,
	isPressed,
	openEditor,
	placeCaret,
	selectText,
	setValue,
	toolbarButton,
	value
} from './helpers';

const BUTTONS = ['bold', 'link', 'mailto', 'source'];

const form = (page: Page): Locator => page.locator('.jodit-mailto');

/** The input of `name` on the open tab */
const field = (page: Page, name: string): Locator =>
	form(page).locator(`[name="${name}"]`).locator('visible=true');

const tab = (page: Page, index: number): Locator =>
	form(page).locator('.jodit-tabs__button').nth(index);

const submit = (page: Page): Promise<void> =>
	form(page).locator('button[type=submit]').click();

/** Labels of the fields on each tab; `*` marks required fields, `!` errors */
function describeForm(page: Page): Promise<Record<string, string[]>> {
	return form(page).evaluate(form => {
		const label = (input: Element): string =>
			(input.querySelector('[class*="__label"]')?.textContent ?? '') +
			(input.classList.contains('jodit-mailto_required') ? '*' : '') +
			(input.className.includes('_has-error_true') ? '!' : '');
		const inputs = (root: Element): string[] =>
			[...root.querySelectorAll('.jodit-ui-input, .jodit-ui-text-area')].map(
				label
			);

		const panels = [...form.querySelectorAll('.jodit-tab')];

		if (!panels.length) {
			return { form: inputs(form) };
		}

		const titles = [...form.querySelectorAll('.jodit-tabs__button')].map(
			button =>
				(button.getAttribute('aria-pressed') === 'true' ? '>' : '') +
				button.textContent!.trim()
		);

		return Object.fromEntries(
			panels.map((panel, index) => [titles[index], inputs(panel)])
		);
	});
}

async function open(page: Page): Promise<void> {
	await toolbarButton(page, 'mailto').click();
	await expect(form(page)).toBeVisible();
}

test.describe('Email link', () => {
	test('has a short form and an "Additional" tab with every field', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await open(page);

		expect(await describeForm(page)).toEqual({
			'>Main': ['To*', 'Subject', 'Link text'],
			Additional: ['To*', 'Cc', 'Bcc', 'Subject', 'Body', 'Link text']
		});
	});

	test('keeps the fields of both tabs in sync', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await open(page);

		await field(page, 'to').fill('a@x.com');
		await field(page, 'subject').fill('Hello');
		await tab(page, 1).click();
		await expect(field(page, 'to')).toHaveValue('a@x.com');
		await expect(field(page, 'subject')).toHaveValue('Hello');

		await field(page, 'subject').fill('Changed');
		await field(page, 'cc').fill('c@z.io');
		await field(page, 'body').fill('Text');
		await expect(tab(page, 1)).toHaveText('Additional (2)');

		await tab(page, 0).click();
		await expect(field(page, 'subject')).toHaveValue('Changed');
	});

	test('inserts an encoded link with the addresses as its text', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await open(page);

		await field(page, 'to').fill('a@x.com; b@y.com');
		await field(page, 'subject').fill('Order #12 & more');
		await tab(page, 1).click();
		await field(page, 'cc').fill('boss@x.com');
		await field(page, 'body').fill('Hello,\nsecond line');
		await expect(form(page).locator('.jodit-mailto__href')).toHaveText(
			'mailto:a@x.com,b@y.com?cc=boss@x.com&subject=Order%20%2312%20%26%20more' +
				'&body=Hello%2C%0D%0Asecond%20line'
		);
		await submit(page);

		await expect(form(page)).toBeHidden();
		expect(await value(page)).toBe(
			'<p><a href="mailto:a@x.com,b@y.com?cc=boss@x.com&amp;subject=Order%20%2312%20%26%20more' +
				'&amp;body=Hello%2C%0D%0Asecond%20line">a@x.com, b@y.com</a></p>'
		);
	});

	test('requires To and checks the addresses', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await open(page);

		await submit(page);
		await expect(form(page)).toContainText('Please fill out this field');

		await field(page, 'to').fill('a@x.com, nope');
		await submit(page);
		await expect(form(page)).toContainText('Invalid email address: nope');
		expect(await value(page)).not.toContain('<a');
	});

	test('accepts one address per field when multiple is off', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS, mailto: { multiple: false } });
		await open(page);

		await field(page, 'to').fill('a@x.com b@y.com');
		await submit(page);
		await expect(form(page)).toContainText('Only one address is allowed');
	});

	test('switches to the tab with the error', async ({ page }) => {
		await openEditor(page, {
			buttons: BUTTONS,
			mailto: { required: { body: true } }
		});
		await open(page);
		await expect(tab(page, 1)).toHaveText('Additional *');

		await field(page, 'to').fill('a@x.com');
		await submit(page);

		expect(await describeForm(page)).toEqual({
			Main: ['To*', 'Subject', 'Link text'],
			'>Additional *': ['To*', 'Cc', 'Bcc', 'Subject', 'Body*!', 'Link text']
		});
	});

	test('shows an error on both copies of a field', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await open(page);
		await tab(page, 1).click();
		await submit(page);

		const fields = await describeForm(page);
		expect(fields.Main[0]).toBe('To*!');
		expect(fields['>Additional'][0]).toBe('To*!');
	});

	test('merges partial field options with the defaults', async ({ page }) => {
		await openEditor(page, {
			buttons: BUTTONS,
			mailto: { fields: { bcc: false }, required: { subject: true } }
		});
		await open(page);

		expect(await describeForm(page)).toEqual({
			'>Main': ['To*', 'Subject*', 'Link text'],
			Additional: ['To*', 'Cc', 'Subject*', 'Body', 'Link text']
		});
	});

	test('has no tabs when no field is only on "Additional"', async ({
		page
	}) => {
		await openEditor(page, {
			buttons: BUTTONS,
			mailto: { fields: { cc: false, bcc: false, body: 'main' } }
		});
		await open(page);

		expect(await describeForm(page)).toEqual({
			form: ['To*', 'Subject', 'Body', 'Link text']
		});
	});

	test('inserts a link without a recipient when To is optional', async ({
		page
	}) => {
		await openEditor(page, {
			buttons: BUTTONS,
			mailto: { required: { to: false, subject: true } }
		});
		await open(page);

		await field(page, 'subject').fill('Feedback');
		await submit(page);
		expect(await value(page)).toBe(
			'<p><a href="mailto:?subject=Feedback">Feedback</a></p>'
		);
	});

	test('turns a selected address into a link', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p>Write to me@example.com today</p>');
		await selectText(page, 'me@example.com');
		await open(page);

		await expect(field(page, 'to')).toHaveValue('me@example.com');
		await expect(field(page, 'text')).toHaveValue('me@example.com');
		await submit(page);

		expect(await value(page)).toBe(
			'<p>Write to <a href="mailto:me@example.com">me@example.com</a> today</p>'
		);
	});

	test('edits a link and keeps its formatting and other headers', async ({
		page
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(
			page,
			'<p><a href="mailto:team@example.com?subject=Hi&amp;In-Reply-To=%3Cid%40x%3E"><strong>Team</strong></a></p>'
		);
		await placeCaret(page, 'strong', 2);
		await open(page);

		await expect(field(page, 'to')).toHaveValue('team@example.com');
		await expect(field(page, 'subject')).toHaveValue('Hi');
		await expect(form(page).locator('button[type=submit]')).toHaveText(
			'Update'
		);
		await field(page, 'subject').fill('Hello');
		await submit(page);

		expect(await value(page)).toBe(
			'<p><a href="mailto:team@example.com?subject=Hello&amp;In-Reply-To=%3Cid%40x%3E"><strong>Team</strong></a></p>'
		);
	});

	test('removes a link and keeps its text', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p><a href="mailto:a@x.com">Write</a> now</p>');
		await placeCaret(page, 'a', 2);
		await open(page);

		await form(page).locator('button', { hasText: 'Unlink' }).click();
		expect(await value(page)).toBe('<p>Write now</p>');
	});

	test('takes over the link tools on email links only', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(
			page,
			'<p><a href="https://example.com/">web</a> and <a href="mailto:a@x.com">mail</a></p>'
		);

		await page.locator('.jodit-wysiwyg a', { hasText: 'web' }).click();
		await expect.poll(() => inlineToolbar(page)).toContain('link');
		await expect.poll(() => isPressed(page, 'link')).toBe(true);
		await expect.poll(() => isPressed(page, 'mailto')).toBe(false);

		await page.locator('.jodit-wysiwyg a', { hasText: 'mail' }).click();
		await expect.poll(() => inlineToolbar(page)).toContain('mailto');
		expect(await inlineToolbar(page)).not.toContain('link');
		await expect.poll(() => isPressed(page, 'link')).toBe(false);
		await expect.poll(() => isPressed(page, 'mailto')).toBe(true);

		await page
			.locator('.jodit-popup .jodit-toolbar-button_mailto button')
			.click();
		await expect(field(page, 'to')).toHaveValue('a@x.com');
	});

	test('leaves email links to the link tools when disabled', async ({
		page
	}) => {
		await openEditor(page, { disablePlugins: ['mailto'] });
		await setValue(page, '<p><a href="mailto:a@x.com">mail</a></p>');

		await expect(toolbarButton(page, 'mailto')).toHaveCount(0);
		await page.locator('.jodit-wysiwyg a').click();
		await expect.poll(() => inlineToolbar(page)).toContain('link');
		await expect.poll(() => isPressed(page, 'link')).toBe(true);
	});

	test('follows the language option', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS, language: 'ru' });
		await open(page);

		expect(await describeForm(page)).toEqual({
			'>Основное': ['Кому*', 'Тема', 'Текст ссылки'],
			Дополнительно: [
				'Кому*',
				'Копия',
				'Скрытая копия',
				'Тема',
				'Текст письма',
				'Текст ссылки'
			]
		});
	});
});
