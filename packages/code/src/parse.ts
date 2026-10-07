import { PLAIN } from './highlight.js';
import { stripButtons } from './buttons.js';
import { normalizeCode } from './render.js';

/** Code, language and settings of an existing block */
export interface BlockData {
	code: string;
	language: string;
	lineNumbers: boolean;

	/** Name of the file the code is offered as, `''` for the default name; `null` when it is not offered */
	download: string | null;
}

/**
 * The block that contains `node`: a block of this plugin, or, unless `plainPre` is false, a plain `<pre>` (with or
 * without `<code>`), which becomes such a block when it is edited. `null` outside a block or outside `root`.
 */
export function findBlock(
	node: Node | null,
	root: HTMLElement,
	plainPre = true
): HTMLElement | null {
	const element =
		node && node.nodeType === Node.ELEMENT_NODE
			? (node as Element)
			: (node?.parentElement ?? null);

	const block =
		element?.closest<HTMLElement>('.jodit-code') ??
		(plainPre ? element?.closest<HTMLElement>('pre') : null) ??
		null;

	return block && block !== root && root.contains(block) ? block : null;
}

/** Reads the code and the settings of a block, see {@link findBlock} */
export function readBlock(block: HTMLElement): BlockData {
	const code =
		block.querySelector('code') ??
		block.querySelector('.jodit-code__pre') ??
		block;

	const language =
		code.getAttribute('data-lang') ??
		block.getAttribute('data-lang') ??
		/(?:^|\s)(?:language|lang)-([\w#+-]+)/.exec(code.className)?.[1] ??
		PLAIN;

	return {
		code: normalizeCode(code.textContent ?? ''),
		language,
		lineNumbers: Boolean(block.querySelector('.jodit-code__lines')),
		download: block.classList.contains('jodit-code')
			? block.getAttribute('data-download')
			: null
	};
}

/** The code and the line numbers of a block, as `<pre>` in the saved HTML and as `<div>` in the editor */
const PARTS = 'jodit-code__(?:pre|lines)';

/**
 * Turns the `<pre>` elements of the blocks into `<div>` elements for the editor: tools that take every `<pre>` of
 * the editor for their own (Jodit PRO `pasteCode`) leave the blocks alone. {@link unlockValue} turns them back.
 */
export function lockValue(html: string): string {
	return html.replace(
		new RegExp(`<pre(\\s[^>]*?\\bclass="${PARTS}"[^>]*)>([\\s\\S]*?)</pre>`, 'g'),
		'<div$1>$2</div>'
	);
}

/**
 * Removes what the editor adds to the blocks (buttons, non-editable state, selection, `<div>` in place of `<pre>`)
 * from an HTML value. The `<code>` of a block gets the `nohighlight` class in place of `language-*`, so that the
 * highlighters of a site (highlight.js, Prism) leave the block alone; its language stays in `data-lang`.
 */
export function unlockValue(html: string): string {
	return stripButtons(html)
		.replace(
			/<div\b[^>]*?\bclass="jodit-code(?:\s[^"]*)?"[^>]*>/g,
			tag =>
				tag
					.replace(/\s+contenteditable="false"/, '')
					.replace(/\s+jodit-code_selected\b/, '')
		)
		.replace(
			new RegExp(`<div(\\s[^>]*?\\bclass="${PARTS}"[^>]*)>([\\s\\S]*?)</div>`, 'g'),
			'<pre$1>$2</pre>'
		)
		.replace(
			/(<code\b[^>]*?\bclass=")(jodit-code__code(?:\s[^"]*)?)"/g,
			(_, start: string, classes: string) => `${start}${noHighlight(classes)}"`
		);
}

/** The classes of the `<code>` of a block with `nohighlight` in place of `language-*` */
export function noHighlight(classes: string): string {
	const rest = classes
		.split(/\s+/)
		.filter(name => name && name !== 'nohighlight' && !/^lang(?:uage)?-/.test(name));
	return [...rest, 'nohighlight'].join(' ');
}
