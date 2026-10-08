import type { Jodit as JoditType } from 'jodit';
import type { IJodit, IUIButton, IUIElement, IUIInput, IUISelect } from 'jodit/types/types/index.js';

import { helpHtml } from './help.js';
import { translate } from './i18n.js';
import { defaultImageSettings } from './images.js';
import type { DatagenImageSettings } from './images.js';
import { insertContent } from './insert.js';
import { LAYOUTS } from './layouts.js';
import type { DatagenLayout } from './layouts.js';
import type { DatagenOptions } from './options.js';
import { TYPES } from './schemas.js';
import type { DatagenData, DatagenField, DatagenTypeName } from './schemas.js';
import { DatagenError, MESSAGES, generate, loadPool } from './source.js';
import { PARTS, TEMPLATE_MESSAGES, checkTemplate, fieldsOf, isWarning, render } from './template.js';
import type { DatagenTemplate, TemplateError, TemplatePart } from './template.js';

type JoditStatic = typeof JoditType;

/** Value of the layout list for the template written in the dialog */
const CUSTOM = 'custom';

/** Prefix of the values of the layouts from the options */
const OWN = 'own:';

/** Key of the remembered choice in the storage of Jodit (localStorage) */
const STORAGE_KEY = 'datagen';

const PART_LABELS: Record<TemplatePart, string> = { before: 'Before', item: 'Item', after: 'After' };

/** The choice of the dialog, kept for the next time */
interface Remembered {
	type?: string;
	count?: number;
	layouts?: Record<string, string>;
	custom?: Record<string, DatagenTemplate>;
	image?: DatagenImageSettings;
}

/** The choice in this page, also when it is not remembered in the browser */
let session: Remembered = {};

function recall(editor: IJodit): Remembered {
	if (!editor.o.datagen.remember) {
		return session;
	}

	const stored = editor.storage.get<Remembered>(STORAGE_KEY);
	return stored && typeof stored === 'object' ? { ...session, ...stored } : session;
}

function remember(editor: IJodit, choice: Remembered): void {
	session = choice;

	if (editor.o.datagen.remember) {
		editor.storage.set(STORAGE_KEY, choice as Record<string, unknown>);
	}
}

/** Types offered in the dialog */
export function typeNames(options: DatagenOptions): DatagenTypeName[] {
	const all = Object.keys(TYPES) as DatagenTypeName[];
	const shown = all.filter(name => options.types?.[name] !== false);

	return shown.length ? shown : all;
}

/** Layouts of `type`: the built-in ones and those of the options */
export function layoutsOf(
	type: DatagenTypeName,
	options: DatagenOptions
): Array<{ value: string; layout: DatagenLayout }> {
	return [
		...Object.entries(LAYOUTS[type]).map(([id, layout]) => ({ value: id, layout })),
		...Object.entries(options.layouts ?? {})
			.filter(([, layout]) => layout && layout.type === type)
			.map(([key, layout]) => ({ value: OWN + key, layout }))
	];
}

const sameTemplate = (a: DatagenTemplate, b: DatagenTemplate): boolean =>
	PARTS.every(part => a[part] === b[part]);

/** Opens the dialog that generates data and inserts it at the caret */
export function openDialog(Jodit: JoditStatic, editor: IJodit): void {
	const { UIBlock, UIButton, UISelect, UIInput, UITextArea } = Jodit.modules;
	const options = editor.o.datagen;
	const names = typeNames(options);
	const memory: Remembered = { ...recall(editor) };
	const t = (text: string, ...params: Array<string | number>) => translate(editor, text, params);

	editor.e.fire('hidePopup');
	editor.s.save();

	let type: DatagenTypeName = names.includes(memory.type as DatagenTypeName)
		? (memory.type as DatagenTypeName)
		: names[0];
	let count = Number.isInteger(memory.count) ? Number(memory.count) : options.defaultCount;
	let image: DatagenImageSettings = { ...defaultImageSettings, ...memory.image };
	let data: DatagenData | null = null;
	let loading = false;
	let request = 0;

	// Data

	const typeSelect = new UISelect(editor, {
		name: 'type',
		label: 'Type',
		options: names.map(name => ({ value: name, text: t(TYPES[name].title) })),
		value: type
	});

	const countInput = new UIInput(editor, {
		name: 'count',
		label: 'Count',
		type: 'number',
		value: String(count)
	});
	const countHint = editor.c.span('jodit-datagen__hint');

	const layoutSelect = new UISelect(editor, { name: 'layout', label: 'Layout', options: [] });

	const shuffle = new UIButton(editor, {
		name: 'shuffle',
		text: 'Shuffle',
		icon: { name: 'update' },
		tooltip: 'Choose other records'
	});

	const imageInputs = {
		width: new UIInput(editor, { name: 'width', label: 'Width', type: 'number', value: String(image.width) }),
		height: new UIInput(editor, { name: 'height', label: 'Height', type: 'number', value: String(image.height) }),
		background: new UIInput(editor, {
			name: 'background',
			label: 'Background',
			value: image.background,
			placeholder: 'random'
		}),
		color: new UIInput(editor, { name: 'color', label: 'Text colour', value: image.color, placeholder: 'ffffff' }),
		text: new UIInput(editor, { name: 'text', label: 'Text', value: image.text, placeholder: '600×400' })
	};

	const mainRow = new UIBlock(editor, [typeSelect, countInput, layoutSelect, shuffle], {
		className: 'jodit-datagen__row'
	});
	countInput.container.appendChild(countHint);

	const imageRow = new UIBlock(editor, Object.values(imageInputs), { className: 'jodit-datagen__row' });

	const dataTab = editor.c.div('jodit-datagen__data');
	dataTab.append(mainRow.container, imageRow.container);

	// Template

	const areas = {} as Record<TemplatePart, IUIInput & { nativeInput: HTMLTextAreaElement }>;
	let focused: TemplatePart = 'item';
	const parts = editor.c.div('jodit-datagen__parts');

	for (const part of PARTS) {
		const area = new UITextArea(editor, {
			name: part,
			label: PART_LABELS[part],
			size: part === 'item' ? 4 : 2,
			resizable: false
		});
		area.nativeInput.spellcheck = false;
		area.nativeInput.setAttribute('autocapitalize', 'off');
		editor.e.on(area.nativeInput, 'focus', () => {
			focused = part;
		});
		editor.e.on(area.nativeInput, 'input', () => onTemplateInput());
		areas[part] = area as typeof areas[TemplatePart];
		parts.appendChild(new UIBlock(editor, [area]).container);
	}

	const fieldList = editor.c.div('jodit-datagen__fields');
	const templateTab = editor.c.div('jodit-datagen__template');
	templateTab.append(parts, fieldList);

	// Help

	const helpTab = editor.c.div('jodit-datagen__help');
	helpTab.innerHTML = helpHtml(editor);

	// Preview

	const problems = editor.c.element('ul', { className: 'jodit-datagen__problems' });
	const status = editor.c.div('jodit-datagen__status');
	const preview = editor.c.element('iframe', { className: 'jodit-datagen__preview' }) as HTMLIFrameElement;
	// Nothing of the template runs in the preview: no scripts, no event handlers, no forms
	preview.setAttribute('sandbox', '');
	preview.title = t('Preview');
	const notice = editor.c.div('jodit-datagen__notice');
	notice.textContent = t('The inserted content is regular content: it cannot be generated again. Check the preview.');

	const tabs = createTabs(Jodit, editor, [
		{ title: 'Data', content: dataTab },
		{ title: 'Template', content: templateTab },
		{ title: 'Help', content: helpTab }
	]);

	const content = editor.c.div('jodit-datagen');
	content.append(tabs.container, problems, status, preview, notice);

	const submit = new UIButton(editor, { name: 'insert', variant: 'primary', text: 'Insert' });
	const cancel = new UIButton(editor, { name: 'cancel', text: 'Cancel' });

	const dialog = editor.dlg({
		minWidth: Math.min(860, editor.ow.innerWidth - 32),
		minHeight: Math.min(640, editor.ow.innerHeight - 32),
		buttons: ['fullsize', 'dialog.close']
	});

	dialog.container.classList.add('jodit-datagen-dialog');
	dialog.setHeader(t('Generate data'));
	dialog.setContent(content);
	dialog.setFooter([cancel as IUIElement, submit as IUIElement]);

	// State

	const template = (): DatagenTemplate => ({
		before: areas.before.value,
		item: areas.item.value,
		after: areas.after.value
	});

	const setTemplate = (value: DatagenTemplate): void => {
		PARTS.forEach(part => {
			areas[part].value = value[part];
		});
	};

	const layouts = () => layoutsOf(type, options);

	const chooseLayout = (value: string): void => {
		const found = layouts().find(item => item.value === value);

		if (found) {
			setTemplate(found.layout);
		} else {
			setTemplate(memory.custom?.[type] ?? template());
		}

		memory.layouts = { ...memory.layouts, [type]: found ? value : CUSTOM };
	};

	const fillLayouts = (): void => {
		const list = layouts();
		const remembered = memory.layouts?.[type];
		const value =
			remembered === CUSTOM && memory.custom?.[type]
				? CUSTOM
				: (list.find(item => item.value === remembered) ?? list[0]).value;

		setOptions(editor, layoutSelect, [
			...list.map(item => ({ value: item.value, text: t(item.layout.title) })),
			{ value: CUSTOM, text: t('Own template') }
		]);
		layoutSelect.nativeInput.value = value;
		chooseLayout(value);
	};

	const fillFields = (): void => {
		const group = (title: string, fields: DatagenField[], part: TemplatePart) => {
			const heading = editor.c.element('h4');
			heading.textContent = t(title);
			fieldList.appendChild(heading);

			for (const field of fields) {
				const button = editor.c.element('button', { type: 'button', className: 'jodit-datagen__field' });
				const name = editor.c.element('code');
				const description = editor.c.span();
				name.textContent = `{{${field.path}}}${field.list ? ' []' : ''}`;
				description.textContent = t(field.description);
				button.append(name, description);
				button.title = t('Insert into the template');
				// Fields of Item go to Item; the others to the focused Before or After
				editor.e.on(button, 'click', () =>
					insertPlaceholder(part === 'item' || focused === 'item' ? part : focused, `{{${field.path}}}`)
				);
				fieldList.appendChild(button);
			}
		};

		fieldList.innerHTML = '';
		group('Item', fieldsOf(TYPES[type], 'item'), 'item');
		group('Before and After', fieldsOf(TYPES[type], 'before'), 'after');
	};

	const insertPlaceholder = (part: TemplatePart, text: string): void => {
		const area = areas[part].nativeInput;
		area.focus();
		area.setRangeText(text, area.selectionStart, area.selectionEnd, 'end');
		onTemplateInput();
	};

	const showProblems = (list: TemplateError[]): void => {
		problems.innerHTML = '';

		for (const problem of list) {
			const item = editor.c.element('li', {
				className: `jodit-datagen__problem${isWarning(problem) ? ' jodit-datagen__problem_warning' : ''}`
			});
			const message = t(TEMPLATE_MESSAGES[problem.code], ...problem.params);
			item.textContent = problem.part ? `${t(PART_LABELS[problem.part])}: ${message}` : message;

			const { part, start, end } = problem;

			if (part && start !== undefined && end !== undefined) {
				editor.e.on(item, 'click', () => {
					tabs.activate(1);
					areas[part].nativeInput.focus();
					areas[part].nativeInput.setSelectionRange(start, end);
				});
			}

			problems.appendChild(item);
		}
	};

	let html = '';

	const update = (): void => {
		const list = checkTemplate(template(), TYPES[type]);
		const blocked = list.some(problem => !isWarning(problem));

		showProblems(list);
		html = data && !blocked ? render(template(), data) : '';
		preview.srcdoc = previewDocument(html);
		submit.state.disabled = loading || !data || blocked;
	};

	const save = (): void => {
		remember(editor, { ...memory, type, count, image });
	};

	const reload = async (): Promise<void> => {
		const id = ++request;

		loading = true;
		status.className = 'jodit-datagen__status';
		status.textContent = t('Loading data…');
		update();

		try {
			const pool = await loadPool(TYPES[type], options);
			const max = Math.max(1, Math.min(options.maxCount, pool ? pool.length : options.maxCount));
			count = Math.min(Math.max(1, count), max);
			countInput.nativeInput.setAttribute('min', '1');
			countInput.nativeInput.setAttribute('max', String(max));
			countInput.value = String(count);
			countHint.textContent = t('1 to %s', max);

			// Not a spread: Jodit keeps the options of the editor on the prototype of its own
			const result = await generate(type, {
				baseUrl: options.baseUrl,
				timeout: options.timeout,
				count,
				image
			});

			if (id !== request) {
				return;
			}

			data = result;
			status.textContent = '';
		} catch (error) {
			if (id !== request) {
				return;
			}

			data = null;
			status.className = 'jodit-datagen__status jodit-datagen__status_error';
			status.textContent = t(
				error instanceof DatagenError ? error.message : MESSAGES.unavailable
			);
		}

		loading = false;
		update();
	};

	const onTemplateInput = (): void => {
		const current = template();
		const chosen = layouts().find(item => item.value === layoutSelect.nativeInput.value);

		if (!chosen || !sameTemplate(chosen.layout, current)) {
			layoutSelect.nativeInput.value = CUSTOM;
			memory.layouts = { ...memory.layouts, [type]: CUSTOM };
			memory.custom = { ...memory.custom, [type]: current };
		}

		updateLater();
	};

	const changeType = (): void => {
		type = typeSelect.value as DatagenTypeName;
		data = null;
		imageRow.container.style.display = type === 'images' ? '' : 'none';
		fillLayouts();
		fillFields();
		void reload();
	};

	const updateLater = editor.async.debounce(update, 200);
	const reloadLater = editor.async.debounce(() => void reload(), 300);

	editor.e.on(typeSelect.nativeInput, 'change', changeType);
	editor.e.on(layoutSelect.nativeInput, 'change', () => {
		chooseLayout(layoutSelect.nativeInput.value);
		update();
	});
	editor.e.on(countInput.nativeInput, 'input', () => {
		const value = Number(countInput.value);

		if (Number.isInteger(value) && value > 0) {
			count = value;
			reloadLater();
		}
	});
	shuffle.onAction(() => void reload());

	Object.entries(imageInputs).forEach(([key, input]) => {
		editor.e.on(input.nativeInput, 'input', () => {
			const value = key === 'width' || key === 'height' ? Number(input.value) : input.value;
			image = { ...image, [key]: value };
			reloadLater();
		});
	});

	cancel.onAction(() => dialog.close());

	submit.onAction(() => {
		update();

		if (submit.state.disabled || !data) {
			return;
		}

		save();
		dialog.close();
		insertContent(editor, html);
	});

	editor.e.on(dialog, 'afterClose', () => {
		editor.s.restore();
		dialog.destruct();
	});

	changeType();
	dialog.open(true, true);

	// The tooltip of the toolbar button stays over the dialog: the pointer has
	// not left the button. `joditCloseDialog` on the window is the event the
	// tooltips of Jodit hide on, and nothing else listens to it.
	editor.async.setTimeout(
		() => editor.e.fire(editor.ow, 'joditCloseDialog'),
		(editor.o.showTooltipDelay ?? 200) + 100
	);
}

/** Replaces the options of a select */
function setOptions(editor: IJodit, select: IUISelect, list: Array<{ value: string; text: string }>): void {
	const native = select.nativeInput;

	native.innerHTML = '';
	list.forEach(({ value, text }) => {
		const option = editor.c.element('option');
		option.value = value;
		option.textContent = text;
		native.appendChild(option);
	});
}

const PREVIEW_STYLES = `
body { margin: 8px 12px; font: 14px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #222; background: #fff; }
table { border-collapse: collapse; margin: 0 0 1em; }
td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; vertical-align: top; }
img { max-width: 100%; height: auto; }
blockquote { margin: 0 0 1em; padding-left: 12px; border-left: 3px solid #ccc; }
`;

/** A page with `html`, for the preview */
function previewDocument(html: string): string {
	return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLES}</style></head><body>${html}</body></html>`;
}

interface Tabs {
	container: HTMLElement;
	activate(index: number): void;
}

/**
 * Tabs with the look of the Jodit dialogs (the `jodit-tabs` classes)
 */
function createTabs(
	Jodit: JoditStatic,
	editor: IJodit,
	list: Array<{ title: string; content: HTMLElement }>
): Tabs {
	const { UIButton } = Jodit.modules;
	const container = editor.c.div('jodit-tabs');
	const buttonsBox = editor.c.div('jodit-tabs__buttons');
	const panelsBox = editor.c.div('jodit-tabs__wrapper');
	buttonsBox.setAttribute('role', 'tablist');
	container.append(buttonsBox, panelsBox);

	const tabs = list.map(({ title, content }, index) => {
		const button: IUIButton = new UIButton(editor, { text: title, role: 'tab' });
		button.container.classList.add('jodit-tabs__button', `jodit-tabs__button_columns_${list.length}`);
		editor.e.on(button.container, 'pointerdown', (e: MouseEvent) => e.preventDefault());
		button.onAction(() => activate(index));

		const panel = editor.c.div('jodit-tab');
		panel.setAttribute('role', 'tabpanel');
		panel.appendChild(content);

		buttonsBox.appendChild(button.container);
		panelsBox.appendChild(panel);

		return { button, panel };
	});

	const activate = (index: number): void => {
		tabs.forEach(({ button, panel }, i) => {
			button.state.activated = i === index;
			panel.classList.toggle('jodit-tab_active', i === index);
		});
	};

	activate(0);

	return { container, activate };
}
