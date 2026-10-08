import type { IJodit } from 'jodit/types/types/index.js';

const BLOCKS = new Set(
	(
		'address article aside blockquote details dialog dd div dl dt fieldset figcaption figure footer form ' +
		'h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table ul'
	).split(' ')
);

const isBlock = (node: Node): boolean =>
	node.nodeType === Node.ELEMENT_NODE && BLOCKS.has(node.nodeName.toLowerCase());

/** The top-level block of the editor that contains `node` */
function closestTopBlock(node: Node, root: HTMLElement): HTMLElement | null {
	let element: Node | null = node;

	while (element && element.parentNode !== root) {
		element = element.parentNode;
	}

	return element && element.nodeType === Node.ELEMENT_NODE ? (element as HTMLElement) : null;
}

/**
 * Puts `html` into the editor at the saved selection. Text and inline elements go to the caret; content with blocks
 * goes in place of the empty block of the caret or after its block, followed by a paragraph to go on typing.
 */
export function insertContent(editor: IJodit, html: string): void {
	editor.s.restore();

	// Parsed in a document of its own: no script or image of the HTML runs or loads before it is in the editor
	const parsed = new DOMParser().parseFromString(`<!DOCTYPE html><body>${html}`, 'text/html');
	const nodes = Array.from(parsed.body.childNodes, node => editor.ed.importNode(node, true));

	if (!nodes.length) {
		return;
	}

	const current = editor.s.current();
	const inside = current && editor.editor.contains(current) ? current : null;

	if (!nodes.some(isBlock)) {
		if (inside) {
			nodes.forEach(node => editor.s.insertNode(node, true, false));
		} else {
			// Without a caret: into the last block when it is empty, otherwise into a new paragraph at the end
			const last = editor.editor.lastElementChild;
			const paragraph =
				last && !last.textContent?.trim() && !last.querySelector('img,iframe,video,table,hr')
					? last
					: editor.editor.appendChild(editor.createInside.element(editor.o.enter));
			paragraph.textContent = '';
			paragraph.append(...nodes);
		}

		editor.synchronizeValues();
		return;
	}

	// Without a caret: after the last block, or in place of it in an empty editor
	const parent = inside
		? closestTopBlock(inside, editor.editor)
		: (editor.editor.lastElementChild as HTMLElement | null);
	const empty = parent && !parent.textContent?.trim() && !parent.querySelector('img,iframe,video,table,hr');
	const fragment = editor.ed.createDocumentFragment();
	fragment.append(...nodes);

	if (parent && empty) {
		parent.replaceWith(fragment);
	} else if (parent && inside) {
		parent.after(fragment);
	} else {
		editor.editor.appendChild(fragment);
	}

	// A paragraph after the content to go on typing
	const last = nodes[nodes.length - 1];
	let next = last.nextSibling;

	if (!next || !isBlock(next)) {
		next = editor.createInside.element(editor.o.enter);
		next.appendChild(editor.createInside.element('br'));
		last.parentNode?.insertBefore(next, last.nextSibling);
	}

	editor.s.setCursorIn(next as HTMLElement, true);
	editor.synchronizeValues();
}
