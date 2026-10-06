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
 * The block that contains `node`: a block of this plugin, or a plain `<pre>` (with or without `<code>`), which
 * becomes such a block when it is edited. `null` outside a block or outside `root`.
 */
export function findBlock(node: Node | null, root: HTMLElement): HTMLElement | null {
	const element =
		node && node.nodeType === Node.ELEMENT_NODE
			? (node as Element)
			: (node?.parentElement ?? null);

	const block =
		element?.closest<HTMLElement>('.jodit-code') ??
		element?.closest<HTMLElement>('pre') ??
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

/** Removes what the editor adds to the blocks (buttons, non-editable state, selection) from an HTML value */
export function unlockValue(html: string): string {
	return stripButtons(html).replace(
		/<div\b[^>]*?\bclass="jodit-code(?:\s[^"]*)?"[^>]*>/g,
		tag =>
			tag
				.replace(/\s+contenteditable="false"/, '')
				.replace(/\s+jodit-code_selected\b/, '')
	);
}
