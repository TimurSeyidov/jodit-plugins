// Copy and download buttons of a block. The runtime adds them on the pages
// that show the content; the plugin adds the same buttons in the editor and
// removes them from the saved HTML.

import { copyText } from './copy.js';
import { fileName } from './filename.js';

export interface ButtonLabels {
	/** Label and tooltip of the copy button */
	copy?: string;

	/** Label shown for a moment after the code is copied */
	copied?: string;

	/** Label and tooltip of the download button */
	download?: string;
}

const ICON = (path: string): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;

const COPY_ICON = ICON(
	'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z'
);
const DONE_ICON = ICON('M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');
const DOWNLOAD_ICON = ICON('M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z');

const BUTTON_STYLE =
	'display:inline-flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;cursor:pointer';

/** Hover style of the buttons: inline styles cannot have one */
export const BUTTON_SHEET =
	'.jodit-code__copy:hover,.jodit-code__copy:focus-visible,.jodit-code__download:hover,.jodit-code__download:focus-visible{background:var(--jodit-code-copy-hover,rgba(127,127,127,.18))!important}';

/** Attribute that marks the buttons the editor adds, see {@link stripButtons} */
export const EDITOR_BUTTON = 'data-jodit-code-button';

function button(
	doc: Document,
	className: string,
	label: string,
	icon: string
): HTMLButtonElement {
	const element = doc.createElement('button');
	element.type = 'button';
	element.className = className;
	element.title = label;
	element.setAttribute('aria-label', label);
	element.style.cssText = BUTTON_STYLE;
	element.innerHTML = icon;
	return element;
}

/** The text of the code of a block, without the line numbers */
function codeOf(block: HTMLElement): string {
	return block.querySelector('code')?.textContent ?? '';
}

/** Saves `text` as a file named `name` */
export function downloadText(doc: Document, name: string, text: string): void {
	const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
	const link = doc.createElement('a');
	link.href = url;
	link.download = name;
	link.style.display = 'none';
	doc.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Adds the copy button, and the download button for a block with `data-download`, to the header of `block`.
 * Returns false when the block has no header or already has the buttons.
 *
 * With `inEditor` the buttons get the {@link EDITOR_BUTTON} attribute and no click handlers: the editor handles
 * their clicks itself (see {@link copyBlock} and {@link downloadBlock}), because undo and redo restore the HTML of
 * a block without its handlers.
 */
export function addButtons(
	block: HTMLElement,
	{ copy = 'Copy code', copied = 'Copied', download = 'Download' }: ButtonLabels = {},
	inEditor = false
): boolean {
	const doc = block.ownerDocument;
	const header = block.querySelector('.jodit-code__header');

	if (!header || header.querySelector('.jodit-code__copy')) {
		return false;
	}

	const buttons: HTMLButtonElement[] = [];
	const name = block.getAttribute('data-download');

	if (name !== null) {
		const save = button(doc, 'jodit-code__download', download, DOWNLOAD_ICON);
		buttons.push(save);
	}

	const copyButton = button(doc, 'jodit-code__copy', copy, COPY_ICON);
	buttons.push(copyButton);

	buttons.forEach(element => {
		if (inEditor) {
			element.setAttribute(EDITOR_BUTTON, '');
		} else {
			element.addEventListener('click', event => {
				event.preventDefault();
				event.stopPropagation();

				if (element === copyButton) {
					void copyBlock(block, { copy, copied });
				} else {
					downloadBlock(block);
				}
			});
		}

		header.appendChild(element);
	});

	return true;
}

/**
 * Copies the code of a block and shows the "copied" state on its copy button for a moment. Resolves to whether
 * the code was copied.
 */
export async function copyBlock(
	block: HTMLElement,
	{ copy = 'Copy code', copied = 'Copied' }: ButtonLabels = {}
): Promise<boolean> {
	const done = await copyText(codeOf(block), block.ownerDocument);
	const copyButton = block.querySelector<HTMLButtonElement>('.jodit-code__copy');

	if (done && copyButton) {
		const show = (icon: string, label: string): void => {
			copyButton.innerHTML = icon;
			copyButton.title = label;
			copyButton.setAttribute('aria-label', label);
		};

		show(DONE_ICON, copied);
		clearTimeout(timers.get(copyButton));
		timers.set(
			copyButton,
			setTimeout(() => show(COPY_ICON, copy), 1500)
		);
	}

	return done;
}

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Saves the code of a block as a file, named after its `data-download` */
export function downloadBlock(block: HTMLElement): void {
	downloadText(
		block.ownerDocument,
		fileName(
			block.getAttribute('data-lang') ?? 'plaintext',
			block.getAttribute('data-download') ?? ''
		),
		codeOf(block)
	);
}

/** Removes the buttons of the blocks from an HTML value */
export function stripButtons(html: string): string {
	return html.replace(
		/<button\b[^>]*\bclass="jodit-code__(?:copy|download)"[^>]*>[\s\S]*?<\/button>/g,
		''
	);
}
