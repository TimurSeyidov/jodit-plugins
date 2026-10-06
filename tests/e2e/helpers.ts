import type { Locator, Page } from '@playwright/test';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Jodit: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		editor: any;

		/** Scratch value for tests that compare state across steps */
		saved?: unknown[];
	}
}

export interface PageOptions {
	/** Build of Jodit and of the plugins: es2015, es2018 or es2021 */
	build?: string;

	/** Plugins loaded with a <script> tag; an empty list loads none */
	plugins?: string[];
}

/** Opens the test page and creates `window.editor` with `options` */
export async function openEditor(
	page: Page,
	options: Record<string, unknown> = {},
	{ build = 'es2021', plugins = ['qrcode', 'mailto'] }: PageOptions = {}
): Promise<void> {
	await page.goto(
		`/tests/e2e/page.html?build=${build}&plugins=${plugins.join(',')}`
	);

	await page.evaluate(options => {
		window.editor = window.Jodit.make('#editor', {
			language: 'en',
			toolbarAdaptive: false,
			...options
		});
	}, options);
}

export function value(page: Page): Promise<string> {
	return page.evaluate(() => window.editor.value as string);
}

export function setValue(page: Page, html: string): Promise<void> {
	return page.evaluate(html => {
		window.editor.value = html;
	}, html);
}

/** Value of the editor with the base64 data of images shortened */
export async function shortValue(page: Page): Promise<string> {
	return (await value(page)).replace(/;base64,[^"]+/g, ';base64,…');
}

export function toolbarButton(page: Page, name: string): Locator {
	return page.locator(
		`.jodit-toolbar__box .jodit-toolbar-button_${name} button`
	);
}

export async function isPressed(page: Page, name: string): Promise<boolean> {
	return (
		(await toolbarButton(page, name).getAttribute('aria-pressed')) === 'true'
	);
}

/** Names of the buttons in the open inline toolbar of Jodit */
export function inlineToolbar(page: Page): Promise<string[]> {
	return page.$$eval('.jodit-popup .jodit-toolbar-button', buttons =>
		buttons.map(
			button =>
				[...button.classList]
					.find(
						name =>
							/^jodit-toolbar-button_[a-z]+$/.test(name) &&
							!/_(size|variant|text)/.test(name)
					)
					?.replace('jodit-toolbar-button_', '') ?? ''
		)
	);
}

/** Puts the caret into the first text node of `selector` inside the editor */
export function placeCaret(
	page: Page,
	selector: string,
	offset = 1
): Promise<void> {
	return page.evaluate(
		({ selector, offset }) => {
			const node = window.editor.editor.querySelector(selector);
			const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
			const text = walker.nextNode() as Text;
			const range = document.createRange();
			range.setStart(text, Math.min(offset, text.length));
			range.collapse(true);
			window.editor.s.selectRange(range);
		},
		{ selector, offset }
	);
}

/** Selects `text` in the editor */
export function selectText(page: Page, text: string): Promise<void> {
	return page.evaluate(text => {
		const walker = document.createTreeWalker(
			window.editor.editor,
			NodeFilter.SHOW_TEXT
		);

		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			const index = node.textContent!.indexOf(text);

			if (index !== -1) {
				const range = document.createRange();
				range.setStart(node, index);
				range.setEnd(node, index + text.length);
				window.editor.s.selectRange(range);
				return;
			}
		}

		throw new Error(`Text not found: ${text}`);
	}, text);
}
