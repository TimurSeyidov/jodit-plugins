// Runtime for the pages that show the code blocks: adds a working copy button,
// and a download button to blocks saved with "Download as a file", to the
// header of every `.jodit-code` block. The saved HTML has no scripts, so the
// buttons are added on the page.

import { addButtons, BUTTON_SHEET } from './buttons.js';

export interface EnhanceOptions {
	/** Label of the copy button, also its tooltip */
	label?: string;

	/** Label shown for a moment after the code is copied */
	copiedLabel?: string;

	/** Label of the download button, also its tooltip */
	downloadLabel?: string;
}

/**
 * Adds the buttons to the code blocks inside `root` that have none yet. Returns the number of blocks it changed.
 * Call it again for blocks added to the page later.
 */
export function enhance(
	root: ParentNode = document,
	{ label, copiedLabel, downloadLabel }: EnhanceOptions = {}
): number {
	const doc = (root as Node).ownerDocument ?? (root as Document);
	let count = 0;

	if (!doc.getElementById('jodit-code-runtime')) {
		const style = doc.createElement('style');
		style.id = 'jodit-code-runtime';
		style.textContent = BUTTON_SHEET;
		doc.head.appendChild(style);
	}

	root.querySelectorAll<HTMLElement>('.jodit-code').forEach(block => {
		// Blocks inside an editor: the buttons would be saved with the content
		if (block.closest('.jodit-wysiwyg, [contenteditable="true"]')) {
			return;
		}

		if (
			addButtons(block, {
				copy: label,
				copied: copiedLabel,
				download: downloadLabel
			})
		) {
			count++;
		}
	});

	return count;
}
