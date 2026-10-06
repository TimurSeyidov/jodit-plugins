import type { Jodit as JoditType } from 'jodit';
import type {
	IControlType,
	IJodit,
	IUIButton,
	IUIElement,
	Nullable
} from 'jodit/types/types/index.js';

import { addButtons, copyBlock, downloadBlock } from './buttons.js';
import type { ButtonLabels } from './buttons.js';
import { fileName } from './filename.js';
import { AUTO, languageLabel, listLanguages } from './highlight.js';
import icon from './icon.svg';
import { langs } from './langs/index.js';
import { defaultOptions } from './options.js';
import { findBlock, readBlock, unlockValue } from './parse.js';
import type { BlockData } from './parse.js';
import { renderBlock } from './render.js';

/** Name of the plugin, the toolbar button and the icon */
export const NAME = 'code';

/** Type of the inline toolbar of a block, see `Config.popup` */
const POPUP = 'jodit-code';

type JoditStatic = typeof JoditType;

const STYLES = `
.jodit-code-dialog { display: flex; flex-direction: column; gap: 8px; height: 100%; box-sizing: border-box; padding: 8px 12px; }
.jodit-code-dialog__settings { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.jodit-code-dialog__settings .jodit-ui-select { min-width: 220px; }
.jodit-code-dialog__file .jodit-ui-input { max-width: 360px; }
.jodit-code-dialog .jodit-tabs { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.jodit-code-dialog .jodit-tabs__wrapper { flex: 1; min-height: 0; }
.jodit-code-dialog .jodit-tab_active { display: flex; flex-direction: column; height: 100%; }
.jodit-code-dialog textarea {
	flex: 1; width: 100%; min-height: 160px; box-sizing: border-box; resize: none;
	font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre; tab-size: 4;
}
.jodit-code-dialog__preview { flex: 1; min-height: 160px; overflow: auto; }
.jodit-code-dialog__preview .jodit-code { margin: 0; }
.jodit-wysiwyg .jodit-code { cursor: default; }
.jodit-wysiwyg .jodit-code.jodit-code_selected { outline: 2px solid var(--jd-color-primary, #1e88e5); outline-offset: 1px; }
`;

/** Language chosen last in the dialog, offered for the next new block */
let lastLanguage: string | null = null;

const registered = new WeakSet<JoditStatic>();

/**
 * Registers the code block plugin, its toolbar button, icon, inline toolbar, default options and translations in the
 * given Jodit class. Calling it again for the same class does nothing.
 */
export function registerCode(Jodit: JoditStatic): void {
	// The plugin registry of Jodit also catches a second copy of this
	// script on the page
	if (registered.has(Jodit) || Jodit.plugins.get(NAME)) {
		return;
	}

	registered.add(Jodit);

	Jodit.modules.Icon.set(NAME, icon);

	const config = Jodit.defaultOptions;
	config.code = { ...defaultOptions, ...config.code };

	config.controls[NAME] = {
		icon: NAME,
		tooltip: 'Insert code',
		isActive: (editor: IJodit) =>
			Boolean(findBlock(editor.s.current(), editor.editor)),
		exec: (editor: IJodit) => {
			openDialog(Jodit, editor, findBlock(editor.s.current(), editor.editor));
		}
	} as IControlType;

	config.popup[POPUP] = [
		{
			name: 'code-edit',
			icon: 'pencil',
			tooltip: 'Edit code',
			exec: (editor: IJodit, block: Nullable<Node>) => {
				openDialog(Jodit, editor, block as HTMLElement);
			}
		},
		{
			name: 'code-copy',
			icon: 'copy',
			tooltip: 'Copy code',
			exec: (editor: IJodit, block: Nullable<Node>) => {
				void copyBlock(block as HTMLElement, labels(editor)).then(
					copied => copied && editor.message.success(editor.i18n('Copied'), 1500)
				);
			}
		},
		{
			name: 'code-delete',
			icon: 'bin',
			tooltip: 'Delete code',
			exec: (editor: IJodit, block: Nullable<Node>) => {
				removeBlock(editor, block as HTMLElement);
			}
		}
	] as Array<IControlType>;

	Object.entries(langs).forEach(([code, dictionary]) => {
		Jodit.lang[code] = { ...Jodit.lang[code], ...dictionary };
	});

	class CodePlugin extends Jodit.modules.Plugin {
		override buttons = [{ name: NAME, group: 'insert' as const }];

		override styles = STYLES;

		protected afterInit(editor: IJodit): void {
			const lock = editor.async.debounce(
				() => lockBlocks(Jodit, editor),
				editor.defaultTimeout
			);

			editor.e
				.on('afterInit.code change.code afterSetMode.code changePlace.code', lock)
				// Blocks are not editable in the editor only
				.on('afterGetValueFromEditor.code', (data: { value: string }) => {
					data.value = unlockValue(data.value);
				})
				.on(editor.editor, 'click.code', (event: MouseEvent) => {
					const block = findBlock(event.target as Node, editor.editor);
					const button = (event.target as Element).closest?.(
						'.jodit-code__copy, .jodit-code__download'
					);

					// The buttons of a block work in the editor too
					if (block && button) {
						event.preventDefault();

						if (button.classList.contains('jodit-code__copy')) {
							void copyBlock(block, labels(editor));
						} else {
							downloadBlock(block);
						}

						return false;
					}

					if (block && block.classList.contains('jodit-code')) {
						selectBlock(Jodit, editor, block);
					} else {
						unselectBlocks(editor);
					}
				})
				// Delete and Backspace remove the selected block
				.on(editor.editor, 'keydown.code', (event: KeyboardEvent) => {
					const block = editor.editor.querySelector<HTMLElement>(
						'.jodit-code_selected'
					);

					if (!block) {
						return;
					}

					if (event.key === 'Delete' || event.key === 'Backspace') {
						event.preventDefault();
						removeBlock(editor, block);
						return false;
					}

					unselectBlocks(editor);
				})
				.on('hidePopup.code', () => unselectBlocks(editor))
				.on(editor.editor, 'dblclick.code', (event: MouseEvent) => {
					const block = findBlock(event.target as Node, editor.editor);
					const onButton = (event.target as Element).closest?.('button');

					if (block && !onButton && block.classList.contains('jodit-code')) {
						event.preventDefault();
						openDialog(Jodit, editor, block);
					}
				});

			lockBlocks(Jodit, editor);
		}

		protected beforeDestruct(editor: IJodit): void {
			editor.e.off('.code').off(editor.editor, '.code');
		}
	}

	Jodit.plugins.add(NAME, CodePlugin);
}

/** Makes the blocks of the editor non-editable: they are changed in the dialog */
function lockBlocks(Jodit: JoditStatic, editor: IJodit): void {
	if (
		editor.isDestructed ||
		editor.getMode() === Jodit.constants.MODE_SOURCE
	) {
		return;
	}

	editor.editor
		.querySelectorAll<HTMLElement>('.jodit-code')
		.forEach(block => {
			block.setAttribute('contenteditable', 'false');
			addButtons(block, labels(editor), true);
		});
}

/** Labels of the block buttons in the language of the editor */
function labels(editor: IJodit): ButtonLabels {
	return {
		copy: editor.i18n('Copy code'),
		copied: editor.i18n('Copied'),
		download: editor.i18n('Download')
	};
}

/** Marks a block as selected and shows its inline toolbar */
function selectBlock(Jodit: JoditStatic, editor: IJodit, block: HTMLElement): void {
	unselectBlocks(editor);
	block.classList.add('jodit-code_selected');
	editor.e.fire(
		'showPopup',
		block,
		() => Jodit.modules.Helpers.position(block, editor),
		POPUP
	);
}

function unselectBlocks(editor: IJodit): void {
	editor.editor
		.querySelectorAll('.jodit-code_selected')
		.forEach(block => block.classList.remove('jodit-code_selected'));
}

function removeBlock(editor: IJodit, block: HTMLElement): void {
	editor.e.fire('hidePopup');
	const next = block.nextElementSibling ?? block.previousElementSibling;
	block.remove();

	if (next) {
		editor.s.setCursorIn(next, true);
	}

	editor.synchronizeValues();
}

/**
 * Opens the dialog for a new block, or for `target`: a block of this plugin or a plain `<pre>`
 */
function openDialog(
	Jodit: JoditStatic,
	editor: IJodit,
	target: HTMLElement | null
): void {
	const { UIBlock, UIButton, UISelect, UICheckbox, UIInput, UITextArea } =
		Jodit.modules;
	const options = editor.o.code;
	const current: BlockData | null = target ? readBlock(target) : null;

	editor.e.fire('hidePopup');
	editor.s.save();

	const languages = listLanguages(options.languages);
	const initialLanguage =
		current?.language ?? lastLanguage ?? options.defaultLanguage ?? AUTO;

	const language = new UISelect(editor, {
		name: 'language',
		label: 'Language',
		options: [
			{ value: AUTO, text: editor.i18n('Auto detect') },
			...languages.map(({ name, label }) => ({ value: name, text: label })),
			// A language of an existing block that the list does not offer
			...(initialLanguage !== AUTO &&
			!languages.some(({ name }) => name === initialLanguage)
				? [{ value: initialLanguage, text: languageLabel(initialLanguage) }]
				: [])
		],
		value: initialLanguage
	});

	const lineNumbers = new UICheckbox(editor, {
		name: 'lineNumbers',
		label: 'Line numbers',
		checked: current?.lineNumbers ?? options.lineNumbers,
		switch: true
	});

	const download = new UICheckbox(editor, {
		name: 'download',
		label: 'Download as a file',
		checked: current ? current.download !== null : options.download,
		switch: true
	});

	const name = new UIInput(editor, {
		name: 'fileName',
		label: 'File name',
		value: current?.download ?? ''
	});

	const code = new UITextArea(editor, {
		name: 'code',
		placeholder: 'Paste or type the code',
		value: current?.code ?? '',
		resizable: false
	});

	const area = code.nativeInput;
	area.spellcheck = false;
	area.setAttribute('autocapitalize', 'off');
	area.setAttribute('autocomplete', 'off');
	area.style.tabSize = String(options.tabSize);

	// Tab indents in the code field instead of moving the focus
	editor.e.on(area, 'keydown', (event: KeyboardEvent) => {
		if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}

		event.preventDefault();
		indent(area, options.indent, event.shiftKey);
	});

	const preview = editor.c.div('jodit-code-dialog__preview');
	const render = (): { language: string; html: string } =>
		renderBlock(area.value, language.value, {
			lineNumbers: isChecked(lineNumbers),
			tabSize: options.tabSize,
			className: options.className,
			download: isChecked(download) ? name.value : false
		});

	const tabs = createTabs(Jodit, editor, [
		{ title: 'Code', content: code.container },
		{
			title: 'Preview',
			content: preview,
			onOpen: () => {
				preview.innerHTML = render().html;

				// The buttons as the runtime adds them on the site; they work here
				const block = preview.querySelector<HTMLElement>('.jodit-code');
				if (block) {
					addButtons(block, labels(editor));
				}
			}
		}
	]);

	const settings = new UIBlock(editor, [language, lineNumbers, download], {
		className: 'jodit-code-dialog__settings'
	});

	// The file name is asked only when the code is offered as a file
	const fileRow = new UIBlock(editor, [name], {
		className: 'jodit-code-dialog__file'
	});

	const updateFileRow = (): void => {
		fileRow.container.style.display = isChecked(download) ? '' : 'none';
		(name.nativeInput as HTMLInputElement).placeholder = fileName(
			language.value === AUTO ? render().language : language.value
		);
	};

	const content = editor.c.div('jodit-code-dialog');
	content.append(settings.container, fileRow.container, tabs.container);
	updateFileRow();

	const submit = new UIButton(editor, {
		name: 'insert',
		variant: 'primary',
		text: current ? 'Update' : 'Insert'
	});
	const cancel = new UIButton(editor, { name: 'cancel', text: 'Cancel' });

	const dialog = editor.dlg({
		minWidth: Math.min(720, editor.ow.innerWidth - 32),
		minHeight: Math.min(520, editor.ow.innerHeight - 32),
		buttons: ['fullsize', 'dialog.close']
	});

	dialog.setHeader(editor.i18n(current ? 'Edit code' : 'Insert code'));
	dialog.setContent(content);
	dialog.setFooter([cancel as IUIElement, submit as IUIElement]);

	cancel.onAction(() => dialog.close());

	submit.onAction(() => {
		if (!area.value.trim()) {
			tabs.activate(0);
			area.focus();
			return;
		}

		const result = render();
		lastLanguage = language.value;
		dialog.close();
		insertBlock(editor, result.html, target);
	});

	const refresh = (): void => {
		updateFileRow();
		tabs.refresh();
	};
	editor.e.on(language.nativeInput, 'change', refresh);
	editor.e.on(lineNumbers.nativeInput, 'change', refresh);
	editor.e.on(download.nativeInput, 'change', refresh);
	editor.e.on(name.nativeInput, 'input', () => tabs.refresh());

	editor.e.on(dialog, 'afterClose', () => {
		editor.s.restore();
		dialog.destruct();
	});

	dialog.open(true, true);
	editor.async.setTimeout(() => area.focus(), 50);

	// The tooltip of the toolbar button stays over the dialog: the pointer has
	// not left the button. `joditCloseDialog` on the window is the event the
	// tooltips of Jodit hide on, and nothing else listens to it.
	editor.async.setTimeout(
		() => editor.e.fire(editor.ow, 'joditCloseDialog'),
		(editor.o.showTooltipDelay ?? 200) + 100
	);
}

function isChecked(checkbox: IUIElement): boolean {
	return Boolean((checkbox as unknown as { nativeInput: HTMLInputElement }).nativeInput.checked);
}

/** Indents (or, with `outdent`, unindents) the selected lines of a text area, or inserts the indent at the caret */
function indent(area: HTMLTextAreaElement, unit: string, outdent: boolean): void {
	const { value, selectionStart: start, selectionEnd: end } = area;

	if (start === end && !outdent) {
		area.setRangeText(unit, start, end, 'end');
		return;
	}

	const lineStart = value.lastIndexOf('\n', start - 1) + 1;
	const lines = value.slice(lineStart, end).split('\n');
	const changed = lines.map(line =>
		outdent
			? line.startsWith(unit)
				? line.slice(unit.length)
				: line.replace(/^[ \t]/, '')
			: unit + line
	);

	area.setRangeText(changed.join('\n'), lineStart, end, 'select');
}

/** Puts the block into the editor, in place of `target` or after the block of the caret */
function insertBlock(editor: IJodit, html: string, target: HTMLElement | null): void {
	editor.s.restore();

	const block = editor.createInside.fromHTML(html) as HTMLElement;

	if (target && editor.editor.contains(target)) {
		target.replaceWith(block);
	} else {
		const current = editor.s.current();
		const parent = current ? closestTopBlock(current, editor.editor) : null;
		const empty =
			parent &&
			!parent.textContent?.trim() &&
			!parent.querySelector('img,iframe,video,.jodit-code');

		if (parent && empty) {
			parent.replaceWith(block);
		} else if (parent) {
			parent.after(block);
		} else {
			editor.s.insertNode(block, false, false);
		}

		// A paragraph after the block to go on typing
		let next = block.nextElementSibling;

		if (!next) {
			next = editor.createInside.element(editor.o.enter);
			next.appendChild(editor.createInside.element('br'));
			block.after(next);
		}

		editor.s.setCursorIn(next, true);
	}

	block.setAttribute('contenteditable', 'false');
	addButtons(block, labels(editor), true);
	editor.synchronizeValues();
}

/** The top-level block of the editor that contains `node` */
function closestTopBlock(node: Node, root: HTMLElement): HTMLElement | null {
	let element: Node | null = node;

	while (element && element.parentNode !== root) {
		element = element.parentNode;
	}

	return element && element.nodeType === Node.ELEMENT_NODE
		? (element as HTMLElement)
		: null;
}

interface Tabs {
	container: HTMLElement;
	activate(index: number): void;
	refresh(): void;
}

/**
 * Tabs with the look of the Jodit dialogs (the `jodit-tabs` classes). `onOpen` of a tab runs when it is shown.
 */
function createTabs(
	Jodit: JoditStatic,
	editor: IJodit,
	list: Array<{ title: string; content: HTMLElement; onOpen?: () => void }>
): Tabs {
	const { UIButton } = Jodit.modules;
	const container = editor.c.div('jodit-tabs');
	const buttonsBox = editor.c.div('jodit-tabs__buttons');
	const panelsBox = editor.c.div('jodit-tabs__wrapper');
	buttonsBox.setAttribute('role', 'tablist');
	container.append(buttonsBox, panelsBox);

	let active = 0;

	const tabs = list.map(({ title, content }, index) => {
		const button: IUIButton = new UIButton(editor, { text: title, role: 'tab' });
		button.container.classList.add(
			'jodit-tabs__button',
			`jodit-tabs__button_columns_${list.length}`
		);
		editor.e.on(button.container, 'pointerdown', (e: MouseEvent) =>
			e.preventDefault()
		);
		button.onAction(() => activate(index));

		const panel = editor.c.div('jodit-tab');
		panel.setAttribute('role', 'tabpanel');
		panel.appendChild(content);

		buttonsBox.appendChild(button.container);
		panelsBox.appendChild(panel);

		return { button, panel };
	});

	const activate = (index: number): void => {
		active = index;
		tabs.forEach(({ button, panel }, i) => {
			button.state.activated = i === index;
			panel.classList.toggle('jodit-tab_active', i === index);
		});
		list[index].onOpen?.();
	};

	activate(0);

	return {
		container,
		activate,
		refresh: () => list[active].onOpen?.()
	};
}
