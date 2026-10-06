import { describe, expect, it } from 'vitest';

import { extensionOf, fileName } from '../src/filename';
import { listLanguages, registerLanguage } from '../src/highlight';
import { unlockValue } from '../src/parse';
import { normalizeCode, renderBlock } from '../src/render';

/** HTML without the inline styles, for readable expectations */
const bare = (html: string): string => html.replace(/ style="[^"]*"/g, '');

describe('renderBlock', () => {
	it('renders the header, the language and the highlighted code', () => {
		const { language, html } = renderBlock('let a = 1;', 'javascript');

		expect(language).toBe('javascript');
		expect(bare(html)).toBe(
			'<div class="jodit-code" data-lang="javascript">' +
				'<div class="jodit-code__header"><span class="jodit-code__lang">JavaScript</span></div>' +
				'<div class="jodit-code__body"><pre class="jodit-code__pre">' +
				'<code class="jodit-code__code language-javascript" data-lang="javascript">' +
				'<span class="jodit-code__keyword">let</span> a = <span class="jodit-code__number">1</span>;' +
				'</code></pre></div></div>'
		);
	});

	it('writes token colors as CSS variables with defaults', () => {
		const { html } = renderBlock('return', 'javascript');

		expect(html).toContain(
			'<span class="jodit-code__keyword" style="color:var(--jodit-code-keyword,#cf222e)">return</span>'
		);
		expect(html).toContain('border:1px solid var(--jodit-code-border,#d0d7de)');
		expect(html).toContain('background:var(--jodit-code-header-background,#eaeef2)');
	});

	it('escapes the code', () => {
		const { html } = renderBlock('<script>alert("x") && 1</script>', 'plaintext');

		expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;) &amp;&amp; 1&lt;/script&gt;');
		expect(html).not.toContain('<script>');
	});

	it('keeps a class on scopes that have no color', () => {
		const { html } = renderBlock('function f(a) {}', 'javascript');

		expect(bare(html)).toContain('<span class="jodit-code__params">a</span>');
	});

	it('treats an unknown language as plain text', () => {
		const { language, html } = renderBlock('a < b', 'no-such-language');

		expect(language).toBe('plaintext');
		expect(bare(html)).toContain('data-lang="plaintext"');
		expect(bare(html)).toContain('<span class="jodit-code__lang">Plain text</span>');
	});

	it('detects the language', () => {
		const { language } = renderBlock(
			'{\n  "name": "jodit",\n  "private": true,\n  "version": "1.0.0"\n}',
			'auto'
		);

		expect(language).toBe('json');
	});

	it('adds line numbers that are left out of selection', () => {
		const { html } = renderBlock('a\nb\nc\n', 'plaintext', { lineNumbers: true });

		expect(bare(html)).toContain(
			'<pre class="jodit-code__lines" aria-hidden="true">1\n2\n3</pre>'
		);
		expect(html).toContain('user-select:none');
		expect(renderBlock('a', 'plaintext').html).not.toContain('jodit-code__lines');
	});

	it('marks a block offered as a file', () => {
		expect(renderBlock('x', 'python', { download: '' }).html).toContain(
			'data-download=""'
		);
		expect(renderBlock('x', 'python', { download: ' a"b.py ' }).html).toContain(
			'data-download="a&quot;b.py"'
		);
		expect(renderBlock('x', 'python', { download: false }).html).not.toContain(
			'data-download'
		);
	});

	it('applies the tab size and the extra classes', () => {
		const { html } = renderBlock('\tx', 'plaintext', {
			tabSize: 2,
			className: 'wide  dark'
		});

		expect(html).toContain('tab-size:2');
		expect(html.startsWith('<div class="jodit-code wide dark"')).toBe(true);
	});
});

describe('normalizeCode', () => {
	it('turns CRLF and CR into LF and drops the final line break', () => {
		expect(normalizeCode('a\r\nb\rc\n')).toBe('a\nb\nc');
	});
});

describe('listLanguages', () => {
	it('lists the common languages sorted by display name', () => {
		const list = listLanguages();
		const labels = list.map(({ label }) => label);

		expect(list.length).toBeGreaterThan(30);
		expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
		expect(list).toContainEqual({ name: 'typescript', label: 'TypeScript' });
	});

	it('keeps the given languages in their order and skips unknown ones', () => {
		expect(listLanguages(['python', 'nope', 'css']).map(({ name }) => name)).toEqual([
			'python',
			'css'
		]);
	});

	it('includes registered languages', () => {
		registerLanguage('jodit-test', () => ({
			name: 'Jodit test',
			contains: [{ scope: 'keyword', match: /\bjodit\b/ }]
		}));

		expect(listLanguages(['jodit-test'])).toEqual([
			{ name: 'jodit-test', label: 'Jodit test' }
		]);
		expect(bare(renderBlock('jodit x', 'jodit-test').html)).toContain(
			'<span class="jodit-code__keyword">jodit</span> x'
		);
	});
});

describe('fileName', () => {
	it('uses Untitled with the extension of the language', () => {
		expect(fileName('javascript')).toBe('Untitled.js');
		expect(fileName('python', '  ')).toBe('Untitled.py');
		expect(fileName('plaintext')).toBe('Untitled.txt');
		expect(fileName('go')).toBe('Untitled.go');
	});

	it('adds the extension to a name without one and keeps a given extension', () => {
		expect(fileName('typescript', 'editor')).toBe('editor.ts');
		expect(fileName('typescript', 'editor.d.ts')).toBe('editor.d.ts');
		expect(fileName('bash', 'Makefile.sh')).toBe('Makefile.sh');
	});

	it('removes path separators and characters file systems reject', () => {
		expect(fileName('python', '../etc/pass:wd')).toBe('etcpasswd.py');
		expect(fileName('python', '...')).toBe('Untitled.py');
	});

	it('maps languages to their usual extensions', () => {
		expect(extensionOf('csharp')).toBe('cs');
		expect(extensionOf('yaml')).toBe('yml');
		expect(extensionOf('php-template')).toBe('php');
		expect(extensionOf('c-like')).toBe('clike');
	});
});

describe('unlockValue', () => {
	it('removes the buttons the editor adds', () => {
		const html =
			'<div class="jodit-code__header"><span class="jodit-code__lang">JS</span>' +
			'<button type="button" class="jodit-code__download" title="Download" style="a" data-jodit-code-button=""><svg><path d="M5"/></svg></button>' +
			'<button type="button" class="jodit-code__copy" title="Copy code" style="a" data-jodit-code-button=""><svg><path d="M16"/></svg></button></div>';

		expect(unlockValue(html)).toBe(
			'<div class="jodit-code__header"><span class="jodit-code__lang">JS</span></div>'
		);
	});

	it('removes the editor-only attributes of the blocks', () => {
		expect(
			unlockValue(
				'<div class="jodit-code jodit-code_selected" data-lang="js" style="a" contenteditable="false"><div class="jodit-code__header">'
			)
		).toBe('<div class="jodit-code" data-lang="js" style="a"><div class="jodit-code__header">');
	});

	it('leaves other elements alone', () => {
		const html =
			'<div class="note" contenteditable="false">x</div><div class="jodit-code-like" contenteditable="false"></div>';
		expect(unlockValue(html)).toBe(html);
	});
});
