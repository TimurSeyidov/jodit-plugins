import { build } from 'esbuild';

import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

import {
	inlineToolbar,
	isPressed,
	openEditor,
	placeCaret,
	setValue,
	toolbarButton,
	value
} from './helpers';

const BUTTONS = ['bold', 'code', 'source'];

const SAMPLE = "class Editor {\n\tbuttons = ['code'];\n}";

const dialog = (page: Page): Locator =>
	page.locator('.jodit-dialog_active_true .jodit-dialog__panel');
const language = (page: Page): Locator => dialog(page).locator('select');
const area = (page: Page): Locator => dialog(page).locator('textarea');
const tab = (page: Page, index: number): Locator =>
	dialog(page).locator('.jodit-tabs__button').nth(index);
/** A switch of the dialog by the name of its input, which is hidden behind the switch styling */
const dialogSwitch = (page: Page, name: string): Locator =>
	dialog(page).locator('.jodit-ui-checkbox').filter({ has: page.locator(`input[name="${name}"]`) });
const lineNumbers = (page: Page): Locator => dialogSwitch(page, 'lineNumbers');
const headerSwitch = (page: Page): Locator => dialogSwitch(page, 'header');
const nativeSwitch = (page: Page): Locator => dialogSwitch(page, 'native');
const downloadSwitch = (page: Page): Locator => dialogSwitch(page, 'download');
const fileNameInput = (page: Page): Locator =>
	dialog(page).locator('.jodit-code-dialog__file input');
const footerButton = (page: Page, text: string): Locator =>
	dialog(page).locator('.jodit-dialog__footer button', { hasText: text });

/** HTML without the inline styles, for readable expectations */
const bare = (html: string): string => html.replace(/ style="[^"]*"/g, '');

async function insertCode(
	page: Page,
	code: string,
	lang = 'javascript'
): Promise<void> {
	await toolbarButton(page, 'code').click();
	await expect(dialog(page)).toBeVisible();
	await language(page).selectOption(lang);
	await area(page).fill(code);
	await footerButton(page, 'Insert').click();
	await expect(dialog(page)).toBeHidden();
}

test.describe('Code block', () => {
	test('adds its button to the default toolbar', async ({ page }) => {
		await openEditor(page);
		await expect(toolbarButton(page, 'code')).toBeVisible();
	});

	test('inserts a highlighted block after the paragraph', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p>Before</p>');
		await placeCaret(page, 'p', 6);
		await insertCode(page, SAMPLE);

		const html = await value(page);
		expect(bare(html)).toMatch(
			/^<p>Before<\/p><div class="jodit-code" data-lang="javascript"><div class="jodit-code__header"><span class="jodit-code__lang">JavaScript<\/span><\/div><div class="jodit-code__body"><pre class="jodit-code__pre"><code class="jodit-code__code nohighlight nohljsln" data-lang="javascript"><span class="jodit-code__keyword">class<\/span> <span class="jodit-code__title">Editor<\/span>/
		);
		expect(html).toContain('style="color:var(--jodit-code-keyword,#cf222e)"');
		expect(html).not.toContain('contenteditable');
		expect(bare(html)).toMatch(/<\/div><p><br><\/p>$/);

		// Not editable in the editor only
		await expect(page.locator('.jodit-wysiwyg .jodit-code')).toHaveAttribute(
			'contenteditable',
			'false'
		);

		// No pre in the editor, for the tools that take every pre for their own
		await expect(page.locator('.jodit-wysiwyg .jodit-code pre')).toHaveCount(0);
		await expect(page.locator('.jodit-wysiwyg div.jodit-code__pre code')).toHaveCount(1);
	});

	test('shows the block in the preview tab', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('python');
		await area(page).fill('def f():\n    return 1');
		await tab(page, 1).click();

		const preview = dialog(page).locator('.jodit-code-dialog__preview .jodit-code');
		await expect(preview).toBeVisible();
		await expect(preview.locator('.jodit-code__lang')).toHaveText('Python');
		await expect(preview.locator('.jodit-code__keyword').first()).toHaveText('def');

		// The preview follows the settings
		await lineNumbers(page).click();
		await expect(preview.locator('.jodit-code__lines')).toHaveText('1\n2');
	});

	test('detects the language', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, '{\n  "name": "jodit",\n  "version": "1.0.0"\n}', 'auto');

		expect(bare(await value(page))).toContain(
			'<span class="jodit-code__lang">JSON</span>'
		);
	});

	test('adds line numbers', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('plaintext');
		await area(page).fill('a\nb\nc');
		await lineNumbers(page).click();
		await footerButton(page, 'Insert').click();

		expect(bare(await value(page))).toContain(
			'<pre class="jodit-code__lines" aria-hidden="true">1\n2\n3</pre>'
		);
	});

	test('indents with Tab in the code field', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS, code: { indent: '  ' } });
		await toolbarButton(page, 'code').click();
		await area(page).fill('a\nb');
		await area(page).evaluate((element: HTMLTextAreaElement) => {
			element.setSelectionRange(0, element.value.length);
		});
		await area(page).press('Tab');
		await expect(area(page)).toHaveValue('  a\n  b');

		await area(page).press('Shift+Tab');
		await expect(area(page)).toHaveValue('a\nb');
		await expect(area(page)).toBeFocused();
	});

	test('does not insert an empty block', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await footerButton(page, 'Insert').click();

		await expect(dialog(page)).toBeVisible();
		await expect(area(page)).toBeFocused();
	});

	test('edits a block on double click', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, 'x = 1', 'python');

		await page.locator('.jodit-wysiwyg .jodit-code').dblclick();
		await expect(dialog(page)).toBeVisible();
		await expect(language(page)).toHaveValue('python');
		await expect(area(page)).toHaveValue('x = 1');
		await expect(footerButton(page, 'Update')).toBeVisible();

		await area(page).fill('x = 2');
		await lineNumbers(page).click();
		await footerButton(page, 'Update').click();

		const html = bare(await value(page));
		expect(html.match(/class="jodit-code"/g)).toHaveLength(1);
		expect(html).toContain('<span class="jodit-code__number">2</span>');
		expect(html).toContain('jodit-code__lines');
	});

	test('has an inline toolbar for the language, line numbers, edit, copy and delete', async ({
		page,
		context,
		baseURL
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
			origin: baseURL
		});
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);

		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();
		await expect.poll(() => inlineToolbar(page)).toEqual([
			'code-language',
			'code-line-numbers',
			'code-header',
			'code-native',
			'code-edit',
			'code-copy',
			'code-delete'
		]);
		await expect(page.locator('.jodit-wysiwyg .jodit-code')).toHaveClass(
			/jodit-code_selected/
		);
		expect(await value(page)).not.toContain('jodit-code_selected');

		await page.locator('.jodit-popup .jodit-ui-group__code-copy button').click();
		await expect
			.poll(() => page.evaluate(() => navigator.clipboard.readText()))
			.toBe(SAMPLE);

		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();
		await page.locator('.jodit-popup .jodit-ui-group__code-edit button').click();
		await expect(area(page)).toHaveValue(SAMPLE);
		await footerButton(page, 'Cancel').click();

		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();
		await page.locator('.jodit-popup .jodit-ui-group__code-delete button').click();
		expect(await value(page)).not.toContain('jodit-code');
	});

	test('changes the language from the inline toolbar', async ({ page }) => {
		await openEditor(page, {
			buttons: BUTTONS,
			code: { languages: ['javascript', 'python'] }
		});
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('javascript');
		await area(page).fill(SAMPLE);
		await lineNumbers(page).click();
		await footerButton(page, 'Insert').click();
		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();

		const languageButton = page.locator(
			'.jodit-popup .jodit-ui-group__code-language button'
		);
		await expect(languageButton).toHaveText('JavaScript');

		// The arrow opens the list as the button does
		const items = page.locator('.jodit-code-languages .jodit-toolbar-button');
		await page
			.locator('.jodit-popup .jodit-ui-group__code-language .jodit-toolbar-button__trigger')
			.click();
		await expect(items).toHaveCount(3);
		await page.keyboard.press('Escape');
		await expect(items).toHaveCount(0);

		await languageButton.click();
		await expect(items).toHaveText(['Auto detect', 'JavaScript', 'Python']);
		await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true');
		await expect(items.nth(2)).not.toHaveAttribute('aria-pressed', 'true');

		await items.nth(2).click();
		const html = bare(await value(page));
		expect(html.match(/class="jodit-code"/g)).toHaveLength(1);
		expect(html).toContain('data-lang="python"');
		expect(html).toContain('<span class="jodit-code__lang">Python</span>');
		expect(html).toContain('jodit-code__lines');
		expect(await value(page)).not.toContain('contenteditable');

		// The block stays selected, with its new language on the button
		await expect(page.locator('.jodit-wysiwyg .jodit-code')).toHaveClass(
			/jodit-code_selected/
		);
		await expect(languageButton).toHaveText('Python');
	});

	test('switches line numbers from the inline toolbar', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();

		const button = page.locator('.jodit-popup .jodit-ui-group__code-line-numbers');
		await expect(button).not.toHaveAttribute('aria-pressed', 'true');

		await button.locator('button').click();
		expect(bare(await value(page))).toContain(
			'<pre class="jodit-code__lines" aria-hidden="true">1\n2\n3</pre>'
		);
		await expect(button).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('.jodit-wysiwyg .jodit-code')).toHaveClass(
			/jodit-code_selected/
		);

		await button.locator('button').click();
		const html = bare(await value(page));
		expect(html).not.toContain('jodit-code__lines');
		expect(html).toContain('data-lang="javascript"');
		expect(html.match(/class="jodit-code"/g)).toHaveLength(1);
		await expect(button).not.toHaveAttribute('aria-pressed', 'true');
	});

	test('deletes the selected block with the keyboard', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);

		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();
		await page.keyboard.press('Delete');
		expect(await value(page)).not.toContain('jodit-code');
	});

	test('turns a plain pre into a block', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(
			page,
			'<pre><code class="language-python">print("hi")</code></pre>'
		);
		await placeCaret(page, 'code', 2);

		await expect.poll(() => isPressed(page, 'code')).toBe(true);
		await toolbarButton(page, 'code').click();
		await expect(language(page)).toHaveValue('python');
		await expect(area(page)).toHaveValue('print("hi")');
		await footerButton(page, 'Update').click();

		const html = bare(await value(page));
		expect(html).toMatch(/^<div class="jodit-code" data-lang="python">/);
		expect(html).not.toContain('<pre><code class="language-python">');
	});

	test('has copy and download buttons in the editor', async ({
		page,
		context,
		baseURL
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
			origin: baseURL
		});
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('python');
		await area(page).fill('print(1)');
		await downloadSwitch(page).click();
		await footerButton(page, 'Insert').click();

		const block = page.locator('.jodit-wysiwyg .jodit-code');
		await expect(block.locator('.jodit-code__header button')).toHaveCount(2);

		await block.locator('.jodit-code__copy').click();
		await expect
			.poll(() => page.evaluate(() => navigator.clipboard.readText()))
			.toBe('print(1)');
		await expect(block.locator('.jodit-code__copy')).toHaveAttribute(
			'aria-label',
			'Copied'
		);

		const [download] = await Promise.all([
			page.waitForEvent('download'),
			block.locator('.jodit-code__download').click()
		]);
		expect(download.suggestedFilename()).toBe('Untitled.py');

		// The buttons are not saved
		const html = await value(page);
		expect(html).toContain('data-download=""');
		expect(html).not.toContain('<button');
	});

	test('asks for a file name only when the code is a file', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('typescript');

		await expect(fileNameInput(page)).toBeHidden();
		await downloadSwitch(page).click();
		await expect(fileNameInput(page)).toBeVisible();
		await expect(fileNameInput(page)).toHaveAttribute('placeholder', 'Untitled.ts');

		await language(page).selectOption('python');
		await expect(fileNameInput(page)).toHaveAttribute('placeholder', 'Untitled.py');

		await area(page).fill('x = 1');
		await fileNameInput(page).fill('script');
		await tab(page, 1).click();
		await expect(
			dialog(page).locator('.jodit-code-dialog__preview .jodit-code__download')
		).toBeVisible();

		await footerButton(page, 'Insert').click();
		expect(await value(page)).toContain('data-download="script"');

		// Editing keeps the setting and the name
		await page.locator('.jodit-wysiwyg .jodit-code').dblclick();
		await expect(fileNameInput(page)).toHaveValue('script');
		await downloadSwitch(page).click();
		await footerButton(page, 'Update').click();
		expect(await value(page)).not.toContain('data-download');
	});

	test('follows the language option', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS, language: 'ru' });
		await toolbarButton(page, 'code').click();

		await expect(dialog(page)).toContainText('Вставить код');
		await expect(tab(page, 1)).toHaveText('Предпросмотр');
		await expect(footerButton(page, 'Вставить')).toBeVisible();
	});
});

test.describe('Code block runtime', () => {
	test('adds a working copy button to the blocks on a page', async ({
		page,
		context,
		baseURL
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
			origin: baseURL
		});

		// The HTML an editor saved, shown on a page with the runtime script
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		const html = await value(page);

		await page.setContent(`<!doctype html><html><head></head><body>${html}</body></html>`);
		await page.addScriptTag({
			url: `${baseURL}/bundle/es2021/plugins/code/code-runtime.min.js`
		});

		const copy = page.locator('.jodit-code__copy');
		await expect(copy).toHaveCount(1);
		await expect(copy).toHaveAttribute('aria-label', 'Copy code');

		await copy.click();
		await expect(copy).toHaveAttribute('aria-label', 'Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SAMPLE);

		// A second run does not add another button
		const added = await page.evaluate(() =>
			(
				window as unknown as { JoditCodeRuntime: { enhance(): number } }
			).JoditCodeRuntime.enhance()
		);
		expect(added).toBe(0);
		await expect(copy).toHaveCount(1);
	});

	test('leaves the blocks inside an editor alone', async ({ page, baseURL }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		await page.addScriptTag({
			url: `${baseURL}/bundle/es2021/plugins/code/code-runtime.min.js`
		});

		// Only the button of the editor, not another one from the runtime
		await expect(page.locator('.jodit-wysiwyg .jodit-code__copy')).toHaveCount(1);
		await expect(
			page.locator('.jodit-code__copy:not([data-jodit-code-button])')
		).toHaveCount(0);
		expect(await value(page)).not.toContain('jodit-code__copy');
	});

	test('adds a download button to blocks offered as a file', async ({
		page,
		baseURL
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('python');
		await area(page).fill('print(1)');
		await downloadSwitch(page).click();
		await fileNameInput(page).fill('report');
		await footerButton(page, 'Insert').click();
		const html = await value(page);

		await page.setContent(`<!doctype html><html><head></head><body>${html}</body></html>`);
		await page.addScriptTag({
			url: `${baseURL}/bundle/es2021/plugins/code/code-runtime.min.js`
		});

		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.locator('.jodit-code__download').click()
		]);
		expect(download.suggestedFilename()).toBe('report.py');
	});
});

/** highlight.js with its common languages as `window.hljs`, as a site would load it */
async function highlightJs(): Promise<string> {
	const result = await build({
		stdin: {
			contents: "import hljs from 'highlight.js/lib/common'; window.hljs = hljs;",
			resolveDir: process.cwd()
		},
		bundle: true,
		format: 'iife',
		write: false
	});
	return result.outputFiles[0].text;
}

test.describe('Code block header', () => {
	test('is switched off in the dialog, and so is the file', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await toolbarButton(page, 'code').click();
		await language(page).selectOption('javascript');
		await area(page).fill(SAMPLE);

		await downloadSwitch(page).click();
		await expect(fileNameInput(page)).toBeVisible();
		await headerSwitch(page).click();
		await expect(downloadSwitch(page)).toBeHidden();
		await expect(fileNameInput(page)).toBeHidden();
		await footerButton(page, 'Insert').click();

		const html = bare(await value(page));
		expect(html).toMatch(
			/^<div class="jodit-code" data-lang="javascript"><div class="jodit-code__body"><pre class="jodit-code__pre">/
		);
		expect(html).not.toContain('jodit-code__header');
		expect(html).not.toContain('data-download');
		await expect(page.locator('.jodit-wysiwyg .jodit-code__copy')).toHaveCount(0);

		// Opened again with the header off
		await page.locator('.jodit-wysiwyg .jodit-code__body').dblclick();
		await expect(headerSwitch(page).locator('input')).not.toBeChecked();
		await footerButton(page, 'Cancel').click();
	});

	test('is switched in the toolbar of the block, both ways', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(
			page,
			'<div class="jodit-code" data-lang="python" data-download="hello"><div class="jodit-code__header"><span class="jodit-code__lang">Python</span></div>' +
				'<div class="jodit-code__body"><pre class="jodit-code__pre"><code class="jodit-code__code nohighlight nohljsln" data-lang="python">x = 1</code></pre></div></div>'
		);
		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();

		const button = page.locator('.jodit-popup .jodit-ui-group__code-header');
		await expect(button).toHaveAttribute('aria-pressed', 'true');

		await button.locator('button').click();
		await expect(button).not.toHaveAttribute('aria-pressed', 'true');
		let html = bare(await value(page));
		expect(html).not.toContain('jodit-code__header');
		// No header, no download button: the block stops offering the file
		expect(html).not.toContain('data-download');

		await button.locator('button').click();
		await expect(button).toHaveAttribute('aria-pressed', 'true');
		html = bare(await value(page));
		expect(html).toContain('<span class="jodit-code__lang">Python</span>');
	});

	test('follows the header option, and a block without it gets no buttons on the site', async ({
		page,
		baseURL
	}) => {
		await openEditor(page, { buttons: BUTTONS, code: { header: false, download: true } });
		await insertCode(page, SAMPLE);
		const saved = await value(page);
		expect(saved).not.toContain('jodit-code__header');
		expect(saved).not.toContain('data-download');

		await page.goto('/tests/e2e/page.html?plugins=');
		await page.addScriptTag({ url: `${baseURL}/bundle/es2021/plugins/code/code-runtime.min.js` });
		const buttons = await page.evaluate(html => {
			const root = document.createElement('div');
			root.innerHTML = html;
			document.body.append(root);
			(
				window as unknown as { JoditCodeRuntime: { enhance(): number } }
			).JoditCodeRuntime.enhance();
			return root.querySelectorAll('button').length;
		}, saved);
		expect(buttons).toBe(0);
	});
});

/** A block saved for the highlighter of the site, as the plugin writes it, without the inline styles */
const NATIVE_JS =
	'<div class="jodit-code" data-lang="javascript" data-native="">' +
	'<div class="jodit-code__header"><span class="jodit-code__lang">JavaScript</span></div>' +
	'<div class="jodit-code__body"><pre class="jodit-code__pre"><code class="language-javascript">' +
	"class Editor {\n\tbuttons = ['code'];\n}</code></pre></div></div>";

test.describe('Code block for the highlighter of the site', () => {
	test('is saved as plain code when switched on in the dialog', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(page, '<p>Before</p>');
		await placeCaret(page, 'p', 6);

		await toolbarButton(page, 'code').click();
		await language(page).selectOption('javascript');
		await area(page).fill(SAMPLE);
		await nativeSwitch(page).click();
		await footerButton(page, 'Insert').click();

		expect(bare(await value(page))).toBe(`<p>Before</p>${NATIVE_JS}<p><br></p>`);

		// In the editor it is a block as any other, with its highlighting
		const block = page.locator('.jodit-wysiwyg .jodit-code');
		await expect(block).toHaveAttribute('data-native', '');
		await expect(block.locator('.jodit-code__keyword').first()).toHaveText('class');
		await expect(page.locator('.jodit-wysiwyg pre')).toHaveCount(0);
	});

	test('is switched in its toolbar, both ways', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		await page.locator('.jodit-wysiwyg .jodit-code__lang').click();

		const button = page.locator('.jodit-popup .jodit-ui-group__code-native');
		await expect(button).not.toHaveAttribute('aria-pressed', 'true');

		await button.locator('button').click();
		await expect(button).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('.jodit-ui-message_variant_info')).toHaveText(
			'The block is saved as plain code for the highlighter of the site'
		);
		expect(bare(await value(page))).toBe(`${NATIVE_JS}<p><br></p>`);

		await button.locator('button').click();
		await expect(button).not.toHaveAttribute('aria-pressed', 'true');
		const html = await value(page);
		expect(html).toContain('<div class="jodit-code" data-lang="javascript" style=');
		expect(html).toContain('var(--jodit-code-keyword');
		expect(html).not.toContain('data-native');
	});

	test('opens saved plain code as a block and saves it the same way', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		const saved =
			'<p>Before</p>' +
			'<div class="jodit-code" data-lang="python" data-download="hello" data-native="">' +
			'<div class="jodit-code__header"><span class="jodit-code__lang">Python</span></div>' +
			'<div class="jodit-code__body"><pre class="jodit-code__lines" aria-hidden="true">1\n2</pre>' +
			'<pre class="jodit-code__pre"><code class="language-python nohljsln">print("hi")\nx = 1</code></pre>' +
			'</div></div>';
		await setValue(page, saved);

		const block = page.locator('.jodit-wysiwyg .jodit-code');
		await expect(block).toHaveAttribute('data-native', '');
		await expect(block).toHaveAttribute('data-download', 'hello');
		await expect(block.locator('.jodit-code__lines')).toHaveText('1\n2');
		// Highlighted in the editor
		await expect(block.locator('code.jodit-code__code span').first()).toBeVisible();
		expect(bare(await value(page))).toBe(saved);

		// Double click opens it with its settings
		await block.locator('.jodit-code__body').dblclick();
		await expect(area(page)).toHaveValue('print("hi")\nx = 1');
		await expect(nativeSwitch(page).locator('input')).toBeChecked();
		await footerButton(page, 'Cancel').click();
	});

	test('follows the native option for new blocks', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS, code: { native: true } });
		await insertCode(page, SAMPLE);
		expect(bare(await value(page))).toBe(`${NATIVE_JS}<p><br></p>`);
	});

	test('is highlighted by highlight.js on the site, under its own header', async ({
		page,
		baseURL
	}) => {
		await openEditor(page, { buttons: BUTTONS, code: { native: true } });
		await insertCode(page, SAMPLE);
		const saved = await value(page);

		const messages: string[] = [];
		page.on('console', message => messages.push(message.text()));
		await page.goto('/tests/e2e/page.html?plugins=');
		await page.addScriptTag({ content: await highlightJs() });
		await page.addScriptTag({ url: `${baseURL}/bundle/es2021/plugins/code/code-runtime.min.js` });

		const site = await page.evaluate(html => {
			const root = document.createElement('div');
			root.innerHTML = html;
			document.body.append(root);
			(window as unknown as { hljs: { highlightAll(): void } }).hljs.highlightAll();
			(
				window as unknown as { JoditCodeRuntime: { enhance(): number } }
			).JoditCodeRuntime.enhance();
			return {
				tokens: [...root.querySelectorAll('code span')].map(span => span.className),
				header: root.querySelector('.jodit-code__lang')?.textContent,
				copy: root.querySelectorAll('.jodit-code__copy').length,
				text: root.querySelector('code')?.textContent
			};
		}, saved);

		expect(site.tokens).toContain('hljs-keyword');
		expect(site.header).toBe('JavaScript');
		expect(site.copy).toBe(1);
		expect(site.text).toBe(SAMPLE);
		expect(messages).toEqual([]);
	});
});

test.describe('Code block on a site', () => {
	test('is left alone by highlight.js', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		const saved = await value(page);

		const messages: string[] = [];
		page.on('console', message => messages.push(message.text()));
		await page.addScriptTag({ content: await highlightJs() });

		const after = await page.evaluate(html => {
			const site = document.createElement('div');
			site.innerHTML = html;
			document.body.append(site);
			(window as unknown as { hljs: { highlightAll(): void } }).hljs.highlightAll();
			return site.innerHTML;
		}, saved);

		expect(after).toBe(saved);
		expect(messages).toEqual([]);
	});

	test('is left alone by the line numbers plugin of highlight.js when it has its own', async ({
		page,
		baseURL
	}) => {
		await openEditor(page, { buttons: BUTTONS });
		const body = (lines: boolean) =>
			'<div class="jodit-code__body">' +
			(lines ? '<pre class="jodit-code__lines" aria-hidden="true">1\n2</pre>' : '') +
			'<pre class="jodit-code__pre"><code class="language-python">x = 1\ny = 2</code></pre></div>';
		await setValue(
			page,
			// Own colors and line numbers; site highlighting with and without line numbers
			'<div class="jodit-code" data-lang="python"><div class="jodit-code__body">' +
				'<pre class="jodit-code__lines" aria-hidden="true">1\n2</pre><pre class="jodit-code__pre">' +
				'<code class="jodit-code__code" data-lang="python">x = 1\ny = 2</code></pre></div></div>' +
				`<div class="jodit-code" data-lang="python" data-native="">${body(true)}</div>` +
				`<div class="jodit-code" data-lang="python" data-native="">${body(false)}</div>`
		);
		const saved = await value(page);

		await page.goto('/tests/e2e/page.html?plugins=');
		await page.addScriptTag({ content: await highlightJs() });
		await page.addScriptTag({
			url: `${baseURL}/node_modules/highlightjs-line-numbers.js/src/highlightjs-line-numbers.js`
		});

		await page.evaluate(html => {
			const root = document.createElement('div');
			root.id = 'site';
			root.innerHTML = html;
			document.body.append(root);
			const hljs = (
				window as unknown as {
					hljs: { highlightAll(): void; initLineNumbersOnLoad(): void };
				}
			).hljs;
			hljs.highlightAll();
			hljs.initLineNumbersOnLoad();
		}, saved);

		const numbered = page.locator('#site .jodit-code').filter({ has: page.locator('table.hljs-ln') });
		await expect(numbered).toHaveCount(1);
		await expect(page.locator('#site .jodit-code').nth(2).locator('table.hljs-ln')).toHaveCount(1);
	});

	test('gets nohighlight when a block saved before is saved again', async ({ page }) => {
		await openEditor(page, { buttons: BUTTONS });
		await setValue(
			page,
			'<div class="jodit-code" data-lang="python"><div class="jodit-code__header"><span class="jodit-code__lang">Python</span></div>' +
				'<div class="jodit-code__body"><pre class="jodit-code__pre"><code class="jodit-code__code language-python" data-lang="python">x = 1</code></pre></div></div>'
		);

		const html = await value(page);
		expect(html).toContain('<code class="jodit-code__code nohighlight nohljsln" data-lang="python">x = 1</code>');
		expect(html).not.toContain('language-python');
	});
});

test.describe('Code block with Jodit PRO', () => {
	test('works next to the PRO code plugin when its button is not in the toolbar', async ({
		page
	}) => {
		// A saved block in the textarea before the editor is made: the first
		// value goes into the editor without setEditorValue
		await openEditor(page, { buttons: BUTTONS });
		await insertCode(page, SAMPLE);
		const saved = await value(page);

		await page.goto('/tests/e2e/page.html?plugins=code&jodit=pro');
		await page.evaluate(html => {
			(document.getElementById('editor') as HTMLTextAreaElement).value =
				'<p>Before</p>' + html;
			window.editor = window.Jodit.make('#editor', {
				language: 'en',
				toolbarAdaptive: false,
				buttons: ['bold', 'code', 'source']
			});
		}, saved);
		await expect(page.locator('.jodit-wysiwyg .jodit-code')).toHaveCount(1);
		await page.waitForTimeout(1000);

		// PRO does not repaint the block
		expect(await value(page)).toBe('<p>Before</p>' + saved);
		await expect(page.locator('.jodit-wysiwyg pre')).toHaveCount(0);

		// Only this plugin answers a click and a double click on the block
		await page.locator('.jodit-wysiwyg .jodit-code__body').hover();
		await page.waitForTimeout(300);
		await expect(page.locator('.jodit-ui-code-tuner__anchor')).toHaveCount(0);

		await page.locator('.jodit-wysiwyg .jodit-code__body').dblclick();
		await expect(page.locator('.jodit-dialog_active_true')).toHaveCount(1);
		await expect(dialog(page)).toContainText('Edit code');
		await footerButton(page, 'Cancel').click();

		// Set as a value too
		await setValue(page, '<p>Again</p>' + saved);
		await page.waitForTimeout(500);
		expect(await value(page)).toBe('<p>Again</p>' + saved);
	});

	test('keeps a block for the site highlighter away from the PRO code plugin', async ({
		page
	}) => {
		await page.goto('/tests/e2e/page.html?plugins=code&jodit=pro');
		await page.evaluate(html => {
			(document.getElementById('editor') as HTMLTextAreaElement).value = html;
			window.editor = window.Jodit.make('#editor', {
				language: 'en',
				toolbarAdaptive: false,
				buttons: ['bold', 'code', 'source']
			});
		}, NATIVE_JS);
		await expect(page.locator('.jodit-wysiwyg .jodit-code[data-native]')).toHaveCount(1);
		await page.waitForTimeout(1000);

		await expect(page.locator('.jodit-wysiwyg pre')).toHaveCount(0);
		expect(bare(await value(page))).toBe(NATIVE_JS);
	});

	test('turns itself off when the PRO code button is in the toolbar', async ({
		page
	}) => {
		const warnings: string[] = [];
		page.on('console', message => {
			if (message.type() === 'warning') {
				warnings.push(message.text());
			}
		});

		await openEditor(
			page,
			{ buttons: ['bold', 'code', 'pasteCode'] },
			{ plugins: ['code'], pro: true }
		);

		await expect(page.locator('.jodit-toolbar-button_paste-code, .jodit-toolbar-button_pasteCode')).toHaveCount(1);
		await expect(toolbarButton(page, 'code')).toBeDisabled();
		expect(warnings.filter(text => text.startsWith('jodit-plugin-code:'))).toEqual([
			'jodit-plugin-code: the "pasteCode" button of Jodit PRO is in the toolbar, so the code plugin is off in this editor'
		]);
	});
});

