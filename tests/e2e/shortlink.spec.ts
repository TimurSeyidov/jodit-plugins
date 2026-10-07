import { expect, test } from './fixtures';
import type { Locator, Page, Route } from '@playwright/test';

import { inlineToolbar, openEditor, selectText, setValue, toolbarButton, value } from './helpers';

const BUTTONS = ['bold', 'link', 'source'];

const LONG = 'https://example.com/a/very/long/path?with=query';
const SHORT = 'https://da.gd/AbC1';

const popup = (page: Page): Locator => page.locator('.jodit-popup').first();
const urlInput = (page: Page): Locator => popup(page).locator('input[data-ref="url_input"]');
const textInput = (page: Page): Locator =>
	popup(page).locator('input[data-ref="content_input"]');
const shortenButton = (page: Page): Locator =>
	popup(page).locator('.jodit-shortlink-field button');
const message = (page: Page, variant: string): Locator =>
	page.locator(`.jodit-ui-message_variant_${variant}`);
const serviceSelect = (page: Page): Locator =>
	popup(page).locator('.jodit-shortlink-field select');
const linkToolbarButton = (page: Page): Locator =>
	popup(page).locator('.jodit-ui-group__shortlink');

/** Answers da.gd and clck.ru with a short link of their own; returns the hosts asked, in order */
async function mockBoth(page: Page): Promise<string[]> {
	const asked: string[] = [];

	for (const host of ['da.gd', 'clck.ru']) {
		await page.route(`https://${host}/**`, route => {
			asked.push(host);
			return route.fulfill({
				body: `https://${host}/X1`,
				headers: { 'access-control-allow-origin': '*' }
			});
		});
	}

	return asked;
}

/**
 * Answers the requests to da.gd as the service does (CORS allowed), without the network.
 * Returns the long URLs that were asked for.
 */
async function mockService(
	page: Page,
	reply: (route: Route) => Promise<void> = route =>
		route.fulfill({ body: SHORT, headers: { 'access-control-allow-origin': '*' } })
): Promise<string[]> {
	const asked: string[] = [];

	await page.route('https://da.gd/**', route => {
		asked.push(new URL(route.request().url()).searchParams.get('url') ?? '');
		return reply(route);
	});

	return asked;
}

async function openLinkForm(page: Page, text: string): Promise<void> {
	await selectText(page, text);
	await toolbarButton(page, 'link').click();
	await expect(urlInput(page)).toBeVisible();
}

test.describe('Short links', () => {
	test('shortens the URL in the link form', async ({ page }) => {
		const asked = await mockService(page);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await urlInput(page).fill(LONG);
		await shortenButton(page).click();

		await expect(urlInput(page)).toHaveValue(SHORT);
		// The text is not the URL: it stays
		await expect(textInput(page)).toHaveValue('the docs');
		expect(asked).toEqual([LONG]);

		await popup(page).locator('button[type=submit]').click();
		expect(await value(page)).toBe(`<p>Read <a href="${SHORT}">the docs</a> here</p>`);
	});

	test('shortens the text too when it is the URL', async ({ page }) => {
		await mockService(page);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, `<p>Read ${LONG} here</p>`);
		await openLinkForm(page, LONG);

		await urlInput(page).fill(LONG);
		await shortenButton(page).click();
		await expect(textInput(page)).toHaveValue(SHORT);

		await popup(page).locator('button[type=submit]').click();
		expect(await value(page)).toBe(`<p>Read <a href="${SHORT}">${SHORT}</a> here</p>`);
	});

	test('shows the error of the service and keeps the URL', async ({ page }) => {
		await mockService(page, route =>
			route.fulfill({
				status: 400,
				body: 'Long URL must have http:// or https:// scheme.',
				headers: { 'access-control-allow-origin': '*' }
			})
		);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await urlInput(page).fill(LONG);
		await shortenButton(page).click();

		await expect(message(page, 'error')).toHaveText(
			'Long URL must have http:// or https:// scheme.'
		);
		await expect(urlInput(page)).toHaveValue(LONG);
		await expect(shortenButton(page)).toBeEnabled();
	});

	test('explains a failure without asking the service', async ({ page }) => {
		const asked = await mockService(page);
		await openEditor(page, { buttons: BUTTONS, language: 'ru' }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await urlInput(page).fill('example.com');
		await shortenButton(page).click();

		await expect(message(page, 'error')).toHaveText(
			'Сократить можно только ссылки http:// и https://'
		);
		expect(asked).toEqual([]);
	});

	test('reports a service that cannot be reached', async ({ page }) => {
		await mockService(page, route => route.abort('failed'));
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await urlInput(page).fill(LONG);
		await shortenButton(page).click();

		await expect(message(page, 'error')).toHaveText(
			'The link shortening service is not available'
		);
	});

	test('shortens a link from its toolbar', async ({ page }) => {
		await mockService(page);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, `<p>Read <a href="${LONG}">${LONG}</a> and <a href="${LONG}">the docs</a></p>`);

		await page.locator('.jodit-wysiwyg a').first().click();
		await expect.poll(() => inlineToolbar(page)).toEqual([
			'eye',
			'link',
			'shortlink',
			'unlink',
			'brush',
			'file'
		]);

		await popup(page).locator('.jodit-ui-group__shortlink button').click();
		await expect(message(page, 'success')).toHaveText('Link shortened');
		expect(await value(page)).toBe(
			`<p>Read <a href="${SHORT}">${SHORT}</a> and <a href="${LONG}">the docs</a></p>`
		);

		// A link with other text keeps the text
		await page.locator('.jodit-wysiwyg a').nth(1).click();
		await popup(page).locator('.jodit-ui-group__shortlink button').click();
		await expect
			.poll(() => value(page))
			.toBe(`<p>Read <a href="${SHORT}">${SHORT}</a> and <a href="${SHORT}">the docs</a></p>`);
	});

	test('offers no shortening for short, email and disabled links', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, `<p><a href="${SHORT}">a</a> <a href="mailto:a@b.c">b</a></p>`);

		for (const index of [0, 1]) {
			await page.locator('.jodit-wysiwyg a').nth(index).click();
			await expect.poll(() => inlineToolbar(page)).toContain('link');
			expect(await inlineToolbar(page)).not.toContain('shortlink');
		}

		await openEditor(
			page,
			{ buttons: BUTTONS, disablePlugins: ['shortlink'] },
			{ plugins: ['shortlink'] }
		);
		await setValue(page, `<p>Read <a href="${LONG}">the docs</a></p>`);
		await page.locator('.jodit-wysiwyg a').click();
		await expect.poll(() => inlineToolbar(page)).toContain('link');
		expect(await inlineToolbar(page)).not.toContain('shortlink');
	});

	test('uses a function as the service', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await page.evaluate(() => {
			window.editor.o.shortlink.service = async (url: string) =>
				`https://go.example/${url.length}`;
		});
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await urlInput(page).fill(LONG);
		await shortenButton(page).click();
		await expect(urlInput(page)).toHaveValue(`https://go.example/${LONG.length}`);
	});

	test('works next to the email link plugin', async ({ page }) => {
		await mockService(page);
		await openEditor(page, { buttons: [...BUTTONS, 'mailto'] }, { plugins: ['mailto', 'shortlink'] });
		await setValue(page, `<p><a href="${LONG}">site</a> <a href="mailto:a@b.c">mail</a></p>`);

		await page.locator('.jodit-wysiwyg a').first().click();
		await expect.poll(() => inlineToolbar(page)).toContain('shortlink');

		await page.locator('.jodit-wysiwyg a').nth(1).click();
		await expect.poll(() => inlineToolbar(page)).toContain('mailto');
		expect(await inlineToolbar(page)).not.toContain('shortlink');
	});

	test('chooses the service in the link form and remembers it', async ({ page }) => {
		const asked = await mockBoth(page);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');

		await expect(serviceSelect(page).locator('option')).toHaveText(['da.gd', 'clck.ru']);
		await expect(serviceSelect(page)).toHaveValue('da.gd');

		await serviceSelect(page).selectOption('clck.ru');
		await urlInput(page).fill(LONG);
		await shortenButton(page).click();
		await expect(urlInput(page)).toHaveValue('https://clck.ru/X1');
		expect(asked).toEqual(['clck.ru']);

		// The next form, and the next editor in this browser, start with clck.ru
		await page.keyboard.press('Escape');
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');
		await expect(serviceSelect(page)).toHaveValue('clck.ru');
	});

	test('chooses the service from the arrow of the link toolbar', async ({ page }) => {
		const asked = await mockBoth(page);
		await openEditor(page, { buttons: BUTTONS }, { plugins: ['shortlink'] });
		await setValue(page, `<p><a href="${LONG}">one</a> <a href="${LONG}">two</a></p>`);

		await page.locator('.jodit-wysiwyg a').first().click();
		await linkToolbarButton(page).locator('.jodit-toolbar-button__trigger').click();
		const items = page.locator('.jodit-popup .jodit-toolbar-button', { hasText: /^(da\.gd|clck\.ru)$/ });
		await expect(items).toHaveText(['da.gd', 'clck.ru']);
		await expect(items.first()).toHaveAttribute('aria-pressed', 'true');

		await items.nth(1).click();
		await expect
			.poll(() => value(page))
			.toBe(`<p><a href="https://clck.ru/X1">one</a> <a href="${LONG}">two</a></p>`);

		// The button itself now uses clck.ru
		await page.locator('.jodit-wysiwyg a').nth(1).click();
		await linkToolbarButton(page).locator('button').first().click();
		await expect
			.poll(() => value(page))
			.toBe('<p><a href="https://clck.ru/X1">one</a> <a href="https://clck.ru/X1">two</a></p>');
		expect(asked).toEqual(['clck.ru', 'clck.ru']);
	});

	test('offers no choice with one service, and does not remember when told so', async ({
		page
	}) => {
		await mockBoth(page);
		await openEditor(
			page,
			{ buttons: BUTTONS, shortlink: { service: 'clck', services: { dagd: false } } },
			{ plugins: ['shortlink'] }
		);
		await setValue(page, `<p>Read the docs, <a href="${LONG}">this</a></p>`);
		await openLinkForm(page, 'the docs');
		await expect(shortenButton(page)).toBeVisible();
		await expect(serviceSelect(page)).toHaveCount(0);
		await page.keyboard.press('Escape');

		await page.locator('.jodit-wysiwyg a').click();
		await expect(linkToolbarButton(page)).toBeVisible();
		await expect(linkToolbarButton(page).locator('.jodit-toolbar-button__trigger')).toHaveCount(0);

		await openEditor(page, { buttons: BUTTONS, shortlink: { remember: false } }, { plugins: ['shortlink'] });
		await setValue(page, '<p>Read the docs here</p>');
		await openLinkForm(page, 'the docs');
		await serviceSelect(page).selectOption('clck.ru');
		expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('shortlinkService');
	});
});
