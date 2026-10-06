import { highlight, languageLabel } from './highlight.js';

/**
 * Colors of the token kinds. Each is written as `var(--jodit-code-<kind>, <color>)`, so a site can change it with
 * a CSS variable on `.jodit-code`.
 */
export const TOKEN_COLORS: Record<string, string> = {
	keyword: '#cf222e',
	string: '#0a3069',
	number: '#0550ae',
	comment: '#6e7781',
	title: '#8250df',
	type: '#953800',
	attr: '#0550ae',
	tag: '#116329',
	variable: '#953800',
	meta: '#0550ae',
	regexp: '#116329',
	addition: '#116329',
	deletion: '#82071e'
};

/** Token kind of each highlight.js scope (the first class of a span, without `hljs-`) */
const SCOPES: Record<string, string> = {
	keyword: 'keyword',
	doctag: 'keyword',
	bullet: 'keyword',
	built_in: 'type',
	type: 'type',
	literal: 'number',
	number: 'number',
	symbol: 'number',
	string: 'string',
	char: 'string',
	link: 'string',
	code: 'string',
	regexp: 'regexp',
	comment: 'comment',
	quote: 'comment',
	meta: 'meta',
	title: 'title',
	section: 'title',
	'selector-id': 'title',
	'selector-class': 'title',
	'selector-pseudo': 'title',
	attr: 'attr',
	attribute: 'attr',
	property: 'attr',
	'selector-attr': 'attr',
	variable: 'variable',
	'template-variable': 'variable',
	tag: 'tag',
	name: 'tag',
	'selector-tag': 'tag',
	addition: 'addition',
	deletion: 'deletion'
};

/** Extra declarations of some token kinds */
const TOKEN_EXTRA: Record<string, string> = {
	comment: 'font-style:italic',
	addition: 'background:var(--jodit-code-addition-background,#dafbe1)',
	deletion: 'background:var(--jodit-code-deletion-background,#ffebe9)'
};

const MONO =
	"var(--jodit-code-font,ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace)";
const SANS =
	"var(--jodit-code-header-font,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif)";
const BORDER = 'var(--jodit-code-border,#d0d7de)';

/** Inline styles of the parts of a block */
export const STYLES = {
	block: `margin:1em 0;border:1px solid ${BORDER};border-radius:var(--jodit-code-radius,6px);overflow:hidden;background:var(--jodit-code-background,#f6f8fa);color:var(--jodit-code-color,#1f2328)`,
	header: `display:flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;background:var(--jodit-code-header-background,#eaeef2);border-bottom:1px solid ${BORDER};color:var(--jodit-code-header-color,#57606a);font:600 12px/1.5 ${SANS}`,
	lang: 'flex:1',
	body: 'display:flex;overflow-x:auto',
	gutter: `margin:0;padding:12px 0 12px 12px;text-align:right;white-space:pre;color:var(--jodit-code-line-number,#8c959f);user-select:none;-webkit-user-select:none;font:400 13px/1.5 ${MONO}`,
	pre: `margin:0;padding:12px 16px;flex:1 0 auto;background:none;border:0;border-radius:0;color:inherit;white-space:pre;font:400 13px/1.5 ${MONO}`,
	code: 'display:block;padding:0;background:none;border:0;color:inherit;font:inherit;white-space:inherit'
};

export interface RenderOptions {
	/** Show line numbers */
	lineNumbers?: boolean;

	/** Width of a tab character, in spaces */
	tabSize?: number;

	/** CSS classes added to the block, separated by spaces */
	className?: string;

	/**
	 * Offer the code as a file: the name of the file, or `''` for `Untitled.<ext>`. Written to `data-download`;
	 * the download button is added by the runtime and in the editor.
	 */
	download?: string | false;
}

const escape = (text: string): string =>
	text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/** Line breaks as `\n`, without the final line break */
export function normalizeCode(code: string): string {
	return code.replace(/\r\n?/g, '\n').replace(/\n$/, '');
}

/** Replaces the classes of highlight.js with the classes and inline styles of the block */
function styleTokens(html: string): string {
	return html.replace(/<span class="([^"]*)">/g, (_, classes: string) => {
		const scope = classes.split(' ')[0].replace(/^hljs-/, '');
		const kind = SCOPES[scope];

		// Scopes without a color keep a class, for styling on the site
		if (!kind) {
			return `<span class="jodit-code__${scope.replace(/[^\w-]/g, '')}">`;
		}

		const style = [
			`color:var(--jodit-code-${kind},${TOKEN_COLORS[kind]})`,
			TOKEN_EXTRA[kind]
		]
			.filter(Boolean)
			.join(';');

		return `<span class="jodit-code__${kind}" style="${style}">`;
	});
}

/**
 * HTML of a code block: a header with the language, optional line numbers and the highlighted code.
 * Every part has a `jodit-code__*` class and inline styles, so the block looks right without any CSS on the site.
 */
export function renderBlock(
	code: string,
	language: string,
	options: RenderOptions = {}
): { language: string; html: string } {
	const source = normalizeCode(code);
	const result = highlight(source, language);
	const lang = escape(result.language);
	const tabSize = options.tabSize ?? 4;
	const classes = ['jodit-code', ...(options.className ?? '').split(/\s+/)]
		.filter(Boolean)
		.join(' ');

	const lines = source.split('\n').length;
	const gutter = options.lineNumbers
		? `<pre class="jodit-code__lines" aria-hidden="true" style="${STYLES.gutter}">${Array.from(
				{ length: lines },
				(_, index) => index + 1
			).join('\n')}</pre>`
		: '';

	const download =
		options.download === undefined || options.download === false
			? ''
			: ` data-download="${escape(options.download.trim())}"`;

	const html =
		`<div class="${escape(classes)}" data-lang="${lang}"${download} style="${STYLES.block}">` +
		`<div class="jodit-code__header" style="${STYLES.header}">` +
		`<span class="jodit-code__lang" style="${STYLES.lang}">${escape(languageLabel(result.language))}</span>` +
		'</div>' +
		`<div class="jodit-code__body" style="${STYLES.body}">` +
		gutter +
		`<pre class="jodit-code__pre" style="${STYLES.pre};tab-size:${tabSize}">` +
		`<code class="jodit-code__code language-${lang}" data-lang="${lang}" style="${STYLES.code}">` +
		styleTokens(result.html) +
		'</code></pre></div></div>';

	return { language: result.language, html };
}
