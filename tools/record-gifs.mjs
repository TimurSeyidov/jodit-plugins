// Records the animated demos of the plugins for the READMEs and the docs:
// a scripted session in a real editor is recorded by Playwright and turned
// into a GIF by ffmpeg (must be installed).
//
//   packages/<name>/docs/media/<name>.gif
//
// Usage: npm run build && node tools/record-gifs.mjs [name...]
// PLAYWRIGHT_CHANNEL=chrome uses the installed Google Chrome.

import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8098;

// A visible mouse pointer: headless browsers do not draw one
const CURSOR = `
addEventListener('DOMContentLoaded', () => {
	const dot = document.createElement('div');
	dot.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:18px;height:18px;' +
		'margin:-9px 0 0 -9px;border-radius:50%;background:rgba(30,30,30,.35);' +
		'border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(0,0,0,.25);' +
		'pointer-events:none;transition:transform .1s';
	document.body.append(dot);
	addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
	addEventListener('mousedown', () => { dot.style.transform = 'scale(.7)'; }, true);
	addEventListener('mouseup', () => { dot.style.transform = ''; }, true);
});
`;

const pause = ms => new Promise(done => setTimeout(done, ms));

/** Moves the pointer to the middle of `locator` and clicks it */
async function click(page, locator, { double = false } = {}) {
	// A long form scrolls inside the popup, as it would for a user
	await locator.scrollIntoViewIfNeeded();
	await pause(200);
	const box = await locator.boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
		steps: 18
	});
	await pause(250);
	await (double
		? page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2)
		: page.mouse.click(box.x + box.width / 2, box.y + box.height / 2));
	await pause(350);
}

async function type(page, locator, text) {
	await click(page, locator);
	await page.keyboard.type(text, { delay: 45 });
	await pause(300);
}

/** Puts the caret at the end of the editor content */
async function caretToEnd(page) {
	await page.evaluate(() =>
		window.editor.s.setCursorIn(window.editor.editor.lastElementChild, false)
	);
}

const scenarios = {
	async shortlink(page) {
		// The services answer from here: the recording does not depend on the network
		const shorts = { 'da.gd': 'https://da.gd/Rk7sQ', 'clck.ru': 'https://clck.ru/3FpWq' };
		for (const [host, short] of Object.entries(shorts)) {
			await page.route(`https://${host}/**`, route =>
				route.fulfill({ body: short, headers: { 'access-control-allow-origin': '*' } })
			);
		}

		const docs =
			'https://timurseyidov.github.io/jodit-plugins/plugins/shortlink/options/#services';
		await page.evaluate(docs => {
			window.editor.value =
				'<p>See the release notes before you update.</p>' +
				`<p>Docs: <a href="${docs}">${docs}</a></p>`;
		}, docs);
		await pause(600);

		// The link form: paste a long URL, shorten it, insert
		await page.evaluate(() => {
			const text = window.editor.editor.querySelector('p').firstChild;
			const range = document.createRange();
			range.setStart(text, 'See '.length);
			range.setEnd(text, 'See the release notes'.length);
			window.editor.s.selectRange(range);
		});
		await pause(500);
		await click(page, page.locator('.jodit-toolbar-button_link button'));
		await pause(400);
		const url = page.locator('.jodit-popup input[data-ref="url_input"]');
		await click(page, url);
		await page.keyboard.type(
			'https://github.com/TimurSeyidov/jodit-plugins/releases?q=shortlink&expanded=true',
			{ delay: 12 }
		);
		await pause(500);
		await click(page, page.locator('.jodit-popup .jodit-shortlink-field button'));
		await pause(1200);
		await click(page, page.locator('.jodit-popup button[type=submit]'));
		await pause(900);

		// An existing link, from its toolbar with another service: the URL text follows
		await click(page, page.locator('.jodit-wysiwyg a').nth(1));
		await pause(700);
		await click(
			page,
			page.locator('.jodit-popup .jodit-ui-group__shortlink .jodit-toolbar-button__trigger')
		);
		await pause(700);
		await click(page, page.locator('.jodit-popup .jodit-toolbar-button', { hasText: /^clck\.ru$/ }));
		await pause(1800);
		await click(page, page.locator('.jodit-toolbar-button_source button'));
		await pause(2200);
	},

	async code(page, size) {
		await page.evaluate(() => {
			window.editor.value = '<p>Greet a user by name:</p>';
		});
		await caretToEnd(page);
		await pause(600);

		const dialog = page.locator('.jodit-dialog_active_true .jodit-dialog__panel');
		await click(page, page.locator('.jodit-toolbar-button_code button'));
		await pause(400);
		await click(page, dialog.locator('select'));
		await dialog.locator('select').selectOption('javascript');
		await pause(500);

		await click(page, dialog.locator('textarea'));
		await page.keyboard.type('function greet(name) {\n', { delay: 40 });
		await page.keyboard.press('Tab');
		await page.keyboard.type('return `Hello, ${name}!`;\n', { delay: 40 });
		await page.keyboard.type('}', { delay: 40 });
		await pause(500);

		await click(page, dialog.locator('.jodit-ui-checkbox').nth(0));
		await pause(300);
		await click(page, dialog.locator('.jodit-ui-checkbox').nth(1));
		await pause(300);
		await type(page, dialog.locator('.jodit-code-dialog__file input'), 'greet');
		await click(page, dialog.locator('.jodit-tabs__button').nth(1));
		await pause(1600);
		await click(
			page,
			dialog.locator('.jodit-dialog__footer button', { hasText: 'Insert' })
		);
		await pause(900);

		// The buttons of the header, then the toolbar of the block
		await click(page, page.locator('.jodit-wysiwyg .jodit-code__copy'));
		await pause(900);
		await click(page, page.locator('.jodit-wysiwyg .jodit-code__lang'));
		await pause(700);

		// Another language and no line numbers, from the toolbar of the block
		const toolbar = page.locator('.jodit-popup .jodit-ui-group__code-language');
		await click(page, toolbar.locator('button').first());
		await pause(500);
		await click(
			page,
			page.locator('.jodit-code-languages .jodit-toolbar-button', {
				hasText: /^TypeScript$/
			})
		);
		await pause(1000);
		await click(
			page,
			page.locator('.jodit-popup .jodit-ui-group__code-line-numbers button')
		);
		await pause(1000);
		await page.mouse.move(size.width - 40, size.height - 30, { steps: 12 });
		await pause(1600);
	},

	async qrcode(page, size) {
		await page.evaluate(() => {
			window.editor.value = '<p>The conference schedule is online: </p>';
		});
		await caretToEnd(page);
		await pause(600);

		await click(page, page.locator('.jodit-toolbar-button_qrcode button'));
		await type(
			page,
			page.locator('.jodit-qrcode textarea'),
			'https://example.com/schedule'
		);
		await pause(900);
		await click(page, page.locator('.jodit-qrcode button[type=submit]'));
		await pause(1200);

		// Edit the inserted code
		await click(page, page.locator('.jodit-wysiwyg img[data-qrcode]'), {
			double: true
		});
		await pause(500);
		await page.keyboard.type('?day=2', { delay: 70 });
		await pause(900);
		await click(page, page.locator('.jodit-qrcode button[type=submit]'));
		await pause(600);

		// Deselect the code: click into the text before it
		const word = await page.evaluate(() => {
			const text = window.editor.editor.querySelector('p').firstChild;
			const range = document.createRange();
			range.selectNodeContents(text);
			const { x, y, width, height } = range.getBoundingClientRect();
			return { x: x + width / 2, y: y + height / 2 };
		});
		await page.mouse.move(word.x, word.y, { steps: 18 });
		await pause(250);
		await page.mouse.click(word.x, word.y);
		await page.mouse.move(size.width - 40, size.height - 30, { steps: 12 });
		await pause(1800);
	},

	async mailto(page, size) {
		await page.evaluate(() => {
			window.editor.value = '<p>Questions about your order? </p>';
		});
		await caretToEnd(page);
		await pause(600);

		const form = page.locator('.jodit-mailto');
		const field = name => form.locator(`[name="${name}"]`).locator('visible=true');

		await click(page, page.locator('.jodit-toolbar-button_mailto button'));
		await type(page, field('to'), 'support@example.com');
		await type(page, field('subject'), 'Order question');
		await type(page, field('text'), 'Write to support');
		await pause(400);

		await click(page, form.locator('.jodit-tabs__button').nth(1));
		await pause(500);
		await type(page, field('cc'), 'sales@example.com');
		await type(page, field('body'), 'Hello, my order number is ');
		await pause(700);
		await click(page, form.locator('button[type=submit]'));

		await pause(1000);

		// The email link gets its own edit button in the link toolbar
		await click(page, page.locator('.jodit-wysiwyg a'));
		await pause(500);
		await page.mouse.move(size.width - 40, size.height - 30, { steps: 12 });
		await pause(1800);
	}
};

// Window size and editor options of each recording; the window is high enough
// for the open dialog
const SETUP = {
	code: {
		size: { width: 800, height: 600 },
		options: {
			height: 540,
			buttons: ['bold', 'italic', '|', 'link', 'code', '|', 'source']
		}
	},
	qrcode: {
		size: { width: 760, height: 580 },
		options: {
			height: 520,
			buttons: ['bold', 'italic', '|', 'link', 'image', 'qrcode']
		}
	},
	shortlink: {
		size: { width: 760, height: 460 },
		plugins: ['shortlink'],
		options: {
			height: 400,
			buttons: ['bold', 'italic', '|', 'link', '|', 'source']
		}
	},
	mailto: {
		size: { width: 760, height: 620 },
		options: {
			height: 560,
			buttons: ['bold', 'italic', '|', 'link', 'mailto']
		}
	}
};

async function record(browser, name) {
	const { size, options, plugins } = SETUP[name];
	const videoDir = mkdtempSync(join(tmpdir(), `gif-${name}-`));
	const context = await browser.newContext({
		viewport: size,
		locale: 'en-US',
		recordVideo: { dir: videoDir, size }
	});
	await context.addInitScript(CURSOR);

	const page = await context.newPage();
	await page.goto(
		`http://127.0.0.1:${PORT}/tests/e2e/page.html` +
			(plugins ? `?plugins=${plugins.join(',')}` : '')
	);
	await page.addStyleTag({
		content: 'body { margin: 24px; background: #fff; }'
	});
	await page.evaluate(options => {
		window.editor = window.Jodit.make('#editor', {
			language: 'en',
			toolbarAdaptive: false,
			showPlaceholder: false,
			...options
		});
	}, options);
	await page.mouse.move(size.width / 2, size.height - 40);

	const started = Date.now();
	await scenarios[name](page, size);
	const seconds = (Date.now() - started) / 1000;

	await context.close();

	const video = join(videoDir, readdirSync(videoDir)[0]);
	const out = join(root, 'packages', name, 'docs', 'media', `${name}.gif`);
	mkdirSync(dirname(out), { recursive: true });

	// Keep only the scenario: the recording also has the page load before it
	const start = Math.max(0, (await videoLength(video)) - seconds);
	execFileSync('ffmpeg', [
		'-y',
		'-loglevel',
		'error',
		'-ss',
		start.toFixed(2),
		'-i',
		video,
		'-vf',
		'fps=12,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];' +
			'[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
		'-loop',
		'0',
		out
	]);
	rmSync(videoDir, { recursive: true, force: true });

	console.log(
		`${out.slice(root.length + 1)}: ${seconds.toFixed(1)} s, ` +
			`${Math.round(statSync(out).size / 1024)} KB`
	);
}

function videoLength(file) {
	return Number(
		execFileSync('ffprobe', [
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'default=noprint_wrappers=1:nokey=1',
			file
		])
			.toString()
			.trim()
	);
}

const names = process.argv.slice(2).length
	? process.argv.slice(2)
	: Object.keys(scenarios);

const server = spawn(process.execPath, [join(root, 'tools/serve.mjs'), PORT], {
	stdio: 'ignore'
});

try {
	await pause(500);
	const browser = await chromium.launch({
		channel: process.env.PLAYWRIGHT_CHANNEL || undefined
	});

	for (const name of names) {
		await record(browser, name);
	}

	await browser.close();
} finally {
	server.kill();
}
