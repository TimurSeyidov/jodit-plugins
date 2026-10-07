import type { Jodit as JoditType } from 'jodit';
import type {
	IControlType,
	IJodit,
	IToolbarButton,
	IUIButton,
	IUIElement,
	Nullable
} from 'jodit/types/types/index.js';

import { addButtons, copyBlock, downloadBlock } from './buttons.js';
import type { ButtonLabels } from './buttons.js';
import { fileName } from './filename.js';
import { AUTO, languageLabel, listLanguages } from './highlight.js';
import icon from './icon.svg';
import lineNumbersIcon from './line-numbers.svg';
import headerIcon from './header.svg';
import nativeIcon from './native.svg';
import { langs } from './langs/index.js';
import { defaultOptions } from './options.js';
import { findBlock, lockValue, readBlock, unlockValue } from './parse.js';
import type { BlockData } from './parse.js';
import { renderBlock, renderNative } from './render.js';

/** Name of the plugin, the toolbar button and the icon */
export const NAME = 'code';

/** Name of the line numbers switch in the inline toolbar, and of its icon */
const LINE_NUMBERS = 'code-line-numbers';

/** Name of the switch of the header in the inline toolbar, and of its icon */
const HEADER = 'code-header';

/** Name of the switch of the site highlighting in the inline toolbar, and of its icon */
const NATIVE = 'code-native';

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
.jodit-code-languages { max-height: 300px; overflow-y: auto; }
.jodit-wysiwyg .jodit-code { cursor: default; }
.jodit-wysiwyg .jodit-code.jodit-code_selected { outline: 2px solid var(--jd-color-primary, #1e88e5); outline-offset: 1px; }
`;

/** Language chosen last in the dialog, offered for the next new block */
let lastLanguage: string | null = null;

const registered = new WeakSet<JoditStatic>();

/** Code block plugin of Jodit PRO */
const PRO_PLUGIN = 'pasteCode';

/** Editors where the plugin is off because the code button of Jodit PRO is in the toolbar */
const yielded = new WeakSet<IJodit>();

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
	Jodit.modules.Icon.set(LINE_NUMBERS, lineNumbersIcon);
	Jodit.modules.Icon.set(NATIVE, nativeIcon);
	Jodit.modules.Icon.set(HEADER, headerIcon);

	const config = Jodit.defaultOptions;
	config.code = { ...defaultOptions, ...config.code };

	config.controls[NAME] = {
		icon: NAME,
		tooltip: 'Insert code',
		isActive: (editor: IJodit) =>
			Boolean(currentBlock(Jodit, editor)),
		isDisabled: (editor: IJodit) => yielded.has(editor),
		exec: (editor: IJodit) => {
			if (!yielded.has(editor)) {
				openDialog(Jodit, editor, currentBlock(Jodit, editor));
			}
		}
	} as IControlType;

	config.popup[POPUP] = [
		{
			name: 'code-language',
			tooltip: 'Language',
			update: (editor: IJodit, button: IToolbarButton) => {
				const block = popupTarget(button);
				button.state.icon.name = '';
				button.state.text = block
					? languageLabel(readBlock(block).language)
					: editor.i18n('Language');
			},
			// With `exec` Jodit draws the dropdown arrow; `false` makes a click on
			// the button itself open the list too
			exec: () => false,
			popup: (
				editor: IJodit,
				block: Nullable<Node>,
				close: () => void
			) => languageMenu(Jodit, editor, block as HTMLElement, close)
		},
		{
			name: LINE_NUMBERS,
			tooltip: 'Line numbers',
			isActive: (_editor: IJodit, button: IToolbarButton) => {
				const block = popupTarget(button);
				return Boolean(block && readBlock(block).lineNumbers);
			},
			exec: (
				editor: IJodit,
				block: Nullable<Node>,
				{ button }: { button: IToolbarButton }
			) => {
				const target = block as HTMLElement;
				rerenderBlock(Jodit, editor, target, {
					lineNumbers: !readBlock(target).lineNumbers
				});
				button.update();

				// Not `undefined`: Jodit would close the inline toolbar
				return true;
			}
		},
		{
			name: HEADER,
			tooltip: 'Header with the language and the copy and download buttons',
			isActive: (_editor: IJodit, button: IToolbarButton) => {
				const block = popupTarget(button);
				return Boolean(block && readBlock(block).header);
			},
			exec: (
				editor: IJodit,
				block: Nullable<Node>,
				{ button }: { button: IToolbarButton }
			) => {
				const target = block as HTMLElement;
				rerenderBlock(Jodit, editor, target, { header: !readBlock(target).header });
				button.update();

				// Not `undefined`: Jodit would close the inline toolbar
				return true;
			}
		},
		{
			name: NATIVE,
			tooltip: 'Use the highlighting of the site',
			isActive: (_editor: IJodit, button: IToolbarButton) => {
				const block = popupTarget(button);
				return Boolean(block && readBlock(block).native);
			},
			exec: (
				editor: IJodit,
				block: Nullable<Node>,
				{ button }: { button: IToolbarButton }
			) => {
				const target = block as HTMLElement;
				rerenderBlock(Jodit, editor, target, { native: !readBlock(target).native });
				button.update();
				editor.message.info(
					editor.i18n(
						readBlock(target).native
							? 'The block is saved as plain code for the highlighter of the site'
							: 'The block is saved with its own highlighting'
					),
					3000
				);

				// Not `undefined`: Jodit would close the inline toolbar
				return true;
			}
		},
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
		/** The code button of Jodit PRO is in the toolbar: this plugin does nothing in the editor */
		private readonly off = proButtonInToolbar(Jodit, this.jodit as IJodit);

		override buttons = this.off ? [] : [{ name: NAME, group: 'insert' as const }];

		override styles = STYLES;

		constructor(editor: IJodit) {
			super(editor);

			if (this.off) {
				yielded.add(editor);
				return;
			}

			// Before the first value gets into the editor, Jodit PRO included
			editor.e.on('beforeSetNativeEditorValue.code', (data: { value: string }) => {
				data.value = lockValue(expandNative(editor, data.value));
			});
		}

		protected afterInit(editor: IJodit): void {
			if (this.off) {
				console.warn(
					`jodit-plugin-code: the "${PRO_PLUGIN}" button of Jodit PRO is in the toolbar, so the code plugin is off in this editor`
				);
				return;
			}

			const lock = editor.async.debounce(
				() => lockBlocks(Jodit, editor),
				editor.defaultTimeout
			);

			editor.e
				.on('afterInit.code change.code afterSetMode.code changePlace.code', lock)
				// Blocks are not editable in the editor only
				.on('afterGetValueFromEditor.code', (data: { value: string }) => {
					data.value = collapseNative(editor, unlockValue(data.value));
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

	// Blocks saved for the site highlighter that came in another way than the
	// value, for example pasted: their code is plain text, highlight it
	editor.editor
		.querySelectorAll<HTMLElement>('.jodit-code[data-native]')
		.forEach(block => {
			if (!block.querySelector('code.jodit-code__code')) {
				block.replaceWith(
					editor.createInside.fromHTML(lockValue(expandBlock(editor, block))) as HTMLElement
				);
			}
		});

	editor.editor
		.querySelectorAll<HTMLElement>('.jodit-code')
		.forEach(block => {
			// A block that came in another way than the value, for example pasted
			block
				.querySelectorAll<HTMLElement>(
					':scope > .jodit-code__body > pre.jodit-code__pre, :scope > .jodit-code__body > pre.jodit-code__lines'
				)
				.forEach(pre => pre.replaceWith(editor.createInside.fromHTML(lockValue(pre.outerHTML))));
			block.setAttribute('contenteditable', 'false');
			addButtons(block, labels(editor), true);
		});
}

/** The HTML of the editor block, with highlighting, for a block saved for the site highlighter */
function expandBlock(editor: IJodit, block: HTMLElement): string {
	const data = readBlock(block);

	return renderBlock(data.code, data.language, {
		lineNumbers: data.lineNumbers,
		tabSize: editor.o.code.tabSize,
		className: editor.o.code.className,
		download: data.download ?? false,
		native: true,
		header: data.header
	}).html;
}

/** The blocks of an HTML value, through a template of the document of the editor */
function eachBlock(
	editor: IJodit,
	html: string,
	selector: string,
	replace: (block: HTMLElement) => string
): string {
	const template = editor.od.createElement('template');
	template.innerHTML = html;
	template.content.querySelectorAll<HTMLElement>(selector).forEach(block => {
		const next = editor.od.createElement('template');
		next.innerHTML = replace(block);
		block.replaceWith(next.content);
	});

	return template.innerHTML;
}

/** Highlights in the editor the blocks of an HTML value that are saved for the site highlighter */
function expandNative(editor: IJodit, html: string): string {
	return html.includes('data-native')
		? eachBlock(editor, html, '.jodit-code[data-native]', block => expandBlock(editor, block))
		: html;
}

/** Saves the blocks of an HTML value marked with `data-native` with plain code for the site highlighter */
function collapseNative(editor: IJodit, html: string): string {
	return html.includes('data-native')
		? eachBlock(editor, html, '.jodit-code[data-native]', block => {
				const data = readBlock(block);

				return renderNative(data.code, data.language, {
					lineNumbers: data.lineNumbers,
					tabSize: editor.o.code.tabSize,
					className: editor.o.code.className,
					download: data.download ?? false,
					header: data.header
				}).html;
			})
		: html;
}

/** The block of the caret; a plain `<pre>` only when Jodit PRO does not handle them */
function currentBlock(Jodit: JoditStatic, editor: IJodit): HTMLElement | null {
	return findBlock(
		editor.s.current(),
		editor.editor,
		!pluginEnabled(Jodit, editor, PRO_PLUGIN)
	);
}

/** The plugin is registered and not in `disablePlugins` of the editor */
function pluginEnabled(Jodit: JoditStatic, editor: IJodit, name: string): boolean {
	const normalize = (value: string): string =>
		value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
	const disabled = editor.o.disablePlugins;
	const list = (Array.isArray(disabled) ? disabled : String(disabled ?? '').split(/[,\s]+/))
		.filter(Boolean)
		.map(normalize);

	return Boolean(Jodit.plugins.get(name)) && !list.includes(normalize(name));
}

/** The code button of Jodit PRO is enabled and in one of the toolbars of the editor */
function proButtonInToolbar(Jodit: JoditStatic, editor: IJodit): boolean {
	if (!pluginEnabled(Jodit, editor, PRO_PLUGIN)) {
		return false;
	}

	const has = (items: unknown): boolean =>
		Array.isArray(items)
			? items.some(has)
			: typeof items === 'string'
				? items.split(/[,\s]+/).includes(PRO_PLUGIN)
				: Boolean(
						items &&
							typeof items === 'object' &&
							((items as { name?: unknown }).name === PRO_PLUGIN ||
								has((items as { buttons?: unknown }).buttons))
					);
	const options = editor.o as unknown as Record<string, unknown>;

	return ['buttons', 'buttonsMD', 'buttonsSM', 'buttonsXS'].some(key => has(options[key]));
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

/** The block of the inline toolbar that `button` belongs to */
function popupTarget(button: IToolbarButton): HTMLElement | null {
	const { target } = button;
	return target && (target as Element).classList?.contains('jodit-code')
		? (target as HTMLElement)
		: null;
}

/** List of the languages offered in the dialog; choosing one highlights `block` again in that language */
function languageMenu(
	Jodit: JoditStatic,
	editor: IJodit,
	block: HTMLElement,
	close: () => void
): IUIElement {
	const current = readBlock(block).language;
	const languages = listLanguages(editor.o.code.languages);
	const items = [
		{ name: AUTO, label: editor.i18n('Auto detect') },
		...languages,
		// The language of the block when the list does not offer it
		...(languages.some(({ name }) => name === current)
			? []
			: [{ name: current, label: languageLabel(current) }])
	];

	const menu = new Jodit.modules.ToolbarCollection(editor);
	menu.mode = 'vertical';
	menu.container.classList.add('jodit-code-languages');
	menu.build(
		items.map(({ name, label }) => ({
			name: `code-language-${name}`,
			text: label,
			isActive: () => name === current,
			exec: (
				_editor: IJodit,
				_current: Nullable<Node>,
				{ originalEvent }: { originalEvent: Event }
			) => {
				// The menu is gone by the time the click reaches the window, so
				// Jodit would take it for a click outside and close the toolbar
				originalEvent.stopPropagation();
				close();
				rerenderBlock(Jodit, editor, block, { language: name });

				// Not `false`: Jodit would run a command of the button's name
				return true;
			}
		})) as Array<IControlType>
	);

	return menu;
}

/** Renders `block` again with `changes` to its language or line numbers, keeping the code and other settings */
function rerenderBlock(
	Jodit: JoditStatic,
	editor: IJodit,
	block: HTMLElement,
	changes: Partial<Pick<BlockData, 'language' | 'lineNumbers' | 'native' | 'header'>>
): void {
	const current = readBlock(block);
	const data = { ...current, ...changes };

	if (
		(data.language === current.language &&
			data.lineNumbers === current.lineNumbers &&
			data.native === current.native &&
			data.header === current.header) ||
		!editor.editor.contains(block)
	) {
		return;
	}

	const { html } = renderBlock(data.code, data.language, {
		lineNumbers: data.lineNumbers,
		tabSize: editor.o.code.tabSize,
		className: editor.o.code.className,
		// Without the header there is no download button: the block stops offering the file
		download: data.header ? (data.download ?? false) : false,
		native: data.native,
		header: data.header
	});

	// The block stays the same element: it is the target of the open inline toolbar
	const next = editor.createInside.fromHTML(lockValue(html)) as HTMLElement;
	[...block.attributes].forEach(({ name }) => block.removeAttribute(name));
	[...next.attributes].forEach(({ name, value }) => block.setAttribute(name, value));
	block.replaceChildren(...next.childNodes);
	block.setAttribute('contenteditable', 'false');
	addButtons(block, labels(editor), true);
	editor.synchronizeValues();
	selectBlock(Jodit, editor, block);
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

	const header = new UICheckbox(editor, {
		name: 'header',
		label: 'Header',
		checked: current?.header ?? options.header,
		switch: true
	});
	header.container.title = editor.i18n('Header with the language and the copy and download buttons');

	const download = new UICheckbox(editor, {
		name: 'download',
		label: 'Download as a file',
		checked: current ? current.download !== null : options.download,
		switch: true
	});

	const native = new UICheckbox(editor, {
		name: 'native',
		label: 'Site highlighting',
		checked: current?.native ?? options.native,
		switch: true
	});
	native.container.title = editor.i18n(
		'Save as plain code for the highlighter of the site (highlight.js, Prism)'
	);

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
			download: isChecked(header) && isChecked(download) ? name.value : false,
			native: isChecked(native),
			header: isChecked(header)
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

	const settings = new UIBlock(editor, [language, lineNumbers, header, download, native], {
		className: 'jodit-code-dialog__settings'
	});

	// The file name is asked only when the code is offered as a file
	const fileRow = new UIBlock(editor, [name], {
		className: 'jodit-code-dialog__file'
	});

	const updateFileRow = (): void => {
		// The download button is in the header
		download.container.style.display = isChecked(header) ? '' : 'none';
		fileRow.container.style.display =
			isChecked(header) && isChecked(download) ? '' : 'none';
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
	editor.e.on(header.nativeInput, 'change', refresh);
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

	const block = editor.createInside.fromHTML(lockValue(html)) as HTMLElement;

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
