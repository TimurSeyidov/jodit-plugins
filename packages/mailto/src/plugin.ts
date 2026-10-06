import type { Jodit as JoditType } from 'jodit';
import type { IControlType, IJodit, IUIInput, Nullable } from 'jodit/types/types';

import icon from './icon.svg';
import { langs } from './langs';
import {
	buildMailto,
	invalidAddresses,
	parseMailto,
	splitAddresses
} from './mailto';
import type { MailtoFields } from './mailto';
import { layout } from './layout';
import { defaultOptions } from './options';
import type { MailtoField, MailtoOptions } from './options';

/** Name of the plugin, the toolbar button and the icon */
export const NAME = 'mailto';

type JoditStatic = typeof JoditType;

const LABELS: Record<MailtoField, string> = {
	to: 'To',
	cc: 'Cc',
	bcc: 'Bcc',
	subject: 'Subject',
	body: 'Body',
	text: 'Link text'
};

const ADDRESS_FIELDS = ['to', 'cc', 'bcc'] as const;

const STYLES = `
.jodit-mailto { min-width: 300px; max-width: 420px; }
.jodit-mailto_required .jodit-ui-input__label::after,
.jodit-mailto_required .jodit-ui-text-area__label::after { content: ' *'; color: #d32f2f; }
.jodit-mailto__tabs { margin-bottom: 4px; }
.jodit-mailto__href {
	margin: 4px 0 8px; padding: 4px 6px; font: 11px/1.4 monospace;
	word-break: break-all; opacity: 0.75; background: rgba(127, 127, 127, 0.1);
}
`;

const registered = new WeakSet<JoditStatic>();

/**
 * Registers the email link plugin, its toolbar button, icon, default options and translations in the given Jodit class.
 * Calling it again for the same class does nothing.
 */
export function registerMailto(Jodit: JoditStatic): void {
	// The plugin registry of Jodit also catches a second copy of this
	// script on the page
	if (registered.has(Jodit) || Jodit.plugins.get(NAME)) {
		return;
	}

	registered.add(Jodit);

	Jodit.modules.Icon.set(NAME, icon);

	const config = Jodit.defaultOptions;
	config.mailto = { ...defaultOptions, ...config.mailto };
	config.controls[NAME] = {
		icon: NAME,
		tooltip: 'Insert email link',
		isActive: (editor: IJodit) =>
			Boolean(findMailtoLink(editor, editor.s.current())),
		popup: (editor: IJodit, current: Nullable<Node>, close: () => void) =>
			createForm(Jodit, editor, findMailtoLink(editor, current), close)
	} as IControlType;

	takeOverLinkControls(config);

	Object.entries(langs).forEach(([code, dictionary]) => {
		Jodit.lang[code] = { ...Jodit.lang[code], ...dictionary };
	});

	class MailtoPlugin extends Jodit.modules.Plugin {
		override buttons = [{ name: NAME, group: 'insert' as const }];

		override styles = STYLES;

		protected afterInit(): void {}

		protected beforeDestruct(): void {}
	}

	Jodit.plugins.add(NAME, MailtoPlugin);
}

type PopupItems = Array<IControlType | string>;
type PopupFactory = (
	editor: IJodit,
	target: HTMLElement | undefined,
	close: () => void
) => PopupItems | HTMLElement | string;

function isEnabled(editor: IJodit): boolean {
	const disabled = editor.o.disablePlugins;
	const list = Array.isArray(disabled)
		? disabled
		: String(disabled).split(/[\s,]+/);

	return !list.map(name => name.toLowerCase()).includes(NAME);
}

/**
 * Makes email links behave as email links in the built-in link UI: the "link" toolbar button is not highlighted inside them,
 * and the "edit" button of the inline link toolbar opens the email link dialog
 */
function takeOverLinkControls(config: JoditStatic['defaultOptions']): void {
	const link = config.controls.link as IControlType | undefined;

	if (link) {
		const tags = link.tags ?? ['a'];

		// Replaces the built-in check "the cursor is inside any <a>"
		config.controls.link = {
			...link,
			tags: undefined,
			isActive: (editor: IJodit) => {
				const current = editor.s.current();
				const element = current
					? closestTag(current, tags, editor.editor)
					: null;

				return Boolean(
					element &&
						!(isEnabled(editor) && findMailtoLink(editor, element))
				);
			}
		} as IControlType;
	}

	const original = config.popup.a as PopupItems | PopupFactory | undefined;

	if (!original) {
		return;
	}

	config.popup.a = ((editor, target, close) => {
		const items =
			typeof original === 'function'
				? original(editor, target, close)
				: original;

		if (
			!Array.isArray(items) ||
			!isEnabled(editor) ||
			!findMailtoLink(editor, target ?? null)
		) {
			return items;
		}

		return items.map(item =>
			item === 'link' || (typeof item === 'object' && item.name === 'link')
				? { name: NAME, icon: 'pencil', tooltip: 'Edit email link' }
				: item
		);
	}) as PopupFactory;
}

/** Closest ancestor of `node` (or `node` itself) with one of `tags`, inside `root` */
function closestTag(
	node: Node,
	tags: string[],
	root: HTMLElement
): Element | null {
	for (
		let current: Node | null = node;
		current && current !== root;
		current = current.parentNode
	) {
		if (
			current.nodeType === Node.ELEMENT_NODE &&
			tags.includes(current.nodeName.toLowerCase())
		) {
			return current as Element;
		}
	}

	return null;
}

function findMailtoLink(
	editor: IJodit,
	current: Nullable<Node>
): HTMLAnchorElement | null {
	const element =
		current && current.nodeType === Node.ELEMENT_NODE
			? (current as Element)
			: (current?.parentElement ?? null);

	const link = element?.closest('a');

	return link &&
		editor.editor.contains(link) &&
		parseMailto(link.getAttribute('href') ?? '')
		? link
		: null;
}

function initialValues(
	editor: IJodit,
	options: MailtoOptions,
	target: HTMLAnchorElement | null
): Record<MailtoField, string> & { headers: MailtoFields['headers'] } {
	const parsed = target ? parseMailto(target.getAttribute('href') ?? '') : null;

	if (parsed) {
		return {
			to: parsed.to.join(', '),
			cc: parsed.cc.join(', '),
			bcc: parsed.bcc.join(', '),
			subject: parsed.subject,
			body: parsed.body,
			text: target?.textContent ?? '',
			headers: parsed.headers
		};
	}

	const selected = options.useSelection
		? (editor.s.sel?.toString().trim() ?? '')
		: '';
	const address = selected.replace(/^mailto:/i, '');
	const isAddress =
		address !== '' && invalidAddresses(splitAddresses(address)).length === 0;

	return {
		to: isAddress ? address : '',
		cc: '',
		bcc: '',
		subject: '',
		body: '',
		text: selected,
		headers: []
	};
}

function createForm(
	Jodit: JoditStatic,
	editor: IJodit,
	target: HTMLAnchorElement | null,
	close: () => void
): HTMLElement {
	const { UIForm, UIBlock, UIInput, UITextArea, UIButton } = Jodit.modules;
	const options = editor.o.mailto;
	const values = initialValues(editor, options, target);

	editor.s.save();

	const href = editor.c.div('jodit-mailto__href');
	const inputs = new Map<MailtoField, IUIInput>();

	const collect = (): MailtoFields => ({
		to: splitAddresses(inputs.get('to')?.value ?? ''),
		cc: splitAddresses(inputs.get('cc')?.value ?? ''),
		bcc: splitAddresses(inputs.get('bcc')?.value ?? ''),
		subject: (inputs.get('subject')?.value ?? '').trim(),
		body: inputs.get('body')?.value ?? '',
		headers: values.headers
	});

	const updateHref = (): void => {
		href.textContent = buildMailto(collect());
	};

	// A field can be on both tabs: `inputs` holds its first input, `copies`
	// all of them, kept in sync while typing
	const copies = new Map<MailtoField, IUIInput[]>();
	let syncing = false;

	const createBlock = (field: MailtoField): InstanceType<typeof UIBlock> => {
		const state = {
			name: field,
			label: LABELS[field],
			required: Boolean(options.required[field]),
			value: values[field],
			placeholder: ADDRESS_FIELDS.includes(field as 'to')
				? options.multiple
					? 'name@example.com, other@example.com'
					: 'name@example.com'
				: '',
			onChange: (value: string) => {
				if (syncing) {
					return;
				}

				syncing = true;
				copies.get(field)?.forEach(copy => {
					if (copy !== input) {
						copy.value = value;
					}
				});
				syncing = false;

				updateHref();
				tabs?.update();
			}
		};

		const input =
			field === 'body'
				? new UITextArea(editor, { ...state, size: 4 })
				: new UIInput(editor, state);

		if (state.required) {
			input.container.classList.add('jodit-mailto_required');
		}

		if (!inputs.has(field)) {
			inputs.set(field, input);
		}

		copies.set(field, [...(copies.get(field) ?? []), input]);

		return new UIBlock(editor, [input]);
	};

	const { main, additional } = layout(options);
	const mainBlocks = main.map(createBlock);
	const additionalBlocks = additional.map(createBlock);

	// Fields that are only on the "Additional" tab
	const extra = additional.filter(field => !main.includes(field));

	let tabs: Tabs | null = null;

	const buttons = [
		new UIButton(editor, {
			name: 'insert',
			type: 'submit',
			variant: 'primary',
			text: target ? 'Update' : 'Insert'
		})
	];

	if (target) {
		const unlink = new UIButton(editor, { name: 'unlink', text: 'Unlink' });

		unlink.onAction(() => {
			editor.s.restore();
			Jodit.modules.Dom.unwrap(target);
			editor.synchronizeValues();
			close();
		});

		buttons.unshift(unlink);
	}

	const actions = new UIBlock(editor, buttons, { align: 'full' });
	const form = new UIForm(editor, [
		...mainBlocks,
		...additionalBlocks,
		actions
	]);
	form.container.classList.add('jodit-mailto');

	// The blocks stay children of the form for validation; their containers
	// are moved into the tab panels after the form has rendered them
	if (additional.length) {
		const tabsWithCounter = createTabs(Jodit, editor, [
			{ title: 'Main', blocks: mainBlocks },
			{ title: 'Additional', blocks: additionalBlocks }
		]);

		tabsWithCounter.update = () =>
			tabsWithCounter.setCounter(
				1,
				extra.filter(field => inputs.get(field)?.value.trim()).length,
				extra.some(field => options.required[field])
			);

		tabs = tabsWithCounter;
		form.container.insertBefore(tabs.container, actions.container);
		tabs.update();
	}

	form.container.insertBefore(href, actions.container);
	updateHref();

	// The form validates required fields; addresses are checked here too, and
	// the tab with the first error is shown
	const validateRequired = form.validate.bind(form);
	form.validate = (): boolean => {
		const valid =
			validateRequired() && validate(editor, options, inputs);

		if (!valid) {
			shareErrors(copies);
			tabs?.showError();
		}

		return valid;
	};

	form.onSubmit(() => {
		insert(editor, options, target, collect(), inputs.get('text')?.value ?? '');
		close();

		return false;
	});

	// Focus the first empty field once the popup is shown, unless the user
	// has already clicked into the form
	editor.async.setTimeout(() => {
		if (form.container.contains(form.container.ownerDocument.activeElement)) {
			return;
		}

		const first = main
			.map(field => inputs.get(field))
			.find(input => input && !input.value);
		(first ?? inputs.get('to'))?.focus();
	}, 50);

	return form.container;
}

interface Tabs {
	container: HTMLElement;
	activate(index: number): void;
	setCounter(index: number, count: number, required: boolean): void;
	showError(): void;
	update(): void;
}

/**
 * Tabs with the look of the Jodit dialogs (the `jodit-tabs` classes). Each tab holds the containers of its blocks.
 */
function createTabs(
	Jodit: JoditStatic,
	editor: IJodit,
	list: Array<{
		title: string;
		blocks: Array<{ container: HTMLElement }>;
	}>
): Tabs {
	const { UIButton } = Jodit.modules;
	const container = editor.c.div('jodit-tabs jodit-mailto__tabs');
	const buttonsBox = editor.c.div('jodit-tabs__buttons');
	const panelsBox = editor.c.div('jodit-tabs__wrapper');
	buttonsBox.setAttribute('role', 'tablist');
	container.append(buttonsBox, panelsBox);

	const tabs = list.map(({ title, blocks }, index) => {
		const button = new UIButton(editor, { text: title, role: 'tab' });
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
		blocks.forEach(block => panel.appendChild(block.container));

		buttonsBox.appendChild(button.container);
		panelsBox.appendChild(panel);

		return { title, button, panel };
	});

	const activate = (active: number): void => {
		tabs.forEach(({ button, panel }, index) => {
			button.state.activated = index === active;
			panel.classList.toggle('jodit-tab_active', index === active);
		});
	};

	activate(0);

	return {
		container,
		activate,
		setCounter(index, count, required) {
			const { title, button } = tabs[index];
			button.state.text =
				editor.i18n(title) +
				(required ? ' *' : '') +
				(count ? ` (${count})` : '');
		},
		showError() {
			const hasError = (panel: HTMLElement): boolean =>
				Boolean(panel.querySelector('[class*="_has-error_true"]'));

			const activeHasError = tabs.some(
				({ button, panel }) => button.state.activated && hasError(panel)
			);

			if (activeHasError) {
				return;
			}

			const index = tabs.findIndex(({ panel }) => hasError(panel));

			if (index !== -1) {
				activate(index);
			}
		},
		update() {}
	};
}

/** Shows the error of a field on every copy of it, so it is visible on both tabs */
function shareErrors(copies: Map<MailtoField, IUIInput[]>): void {
	copies.forEach(list => {
		const message = list
			.map(
				input =>
					input.container.querySelector('[class*="__error"]')?.textContent
			)
			.find(Boolean);

		if (message) {
			list.forEach(input => {
				input.error = message;
			});
		}
	});
}

function validate(
	editor: IJodit,
	options: MailtoOptions,
	inputs: Map<MailtoField, IUIInput>
): boolean {
	let valid = true;

	ADDRESS_FIELDS.forEach(field => {
		const input = inputs.get(field);

		if (!input) {
			return;
		}

		const addresses = splitAddresses(input.value);
		const invalid = options.validate ? invalidAddresses(addresses) : [];

		if (invalid.length) {
			input.error = editor.i18n('Invalid email address: %s', invalid.join(', '));
			valid = false;
		} else if (!options.multiple && addresses.length > 1) {
			input.error = 'Only one address is allowed';
			valid = false;
		}
	});

	return valid;
}

function insert(
	editor: IJodit,
	options: MailtoOptions,
	target: HTMLAnchorElement | null,
	fields: MailtoFields,
	text: string
): void {
	editor.s.restore();

	const label =
		text.trim() || fields.to.join(', ') || fields.subject || 'email';

	const link =
		target && editor.editor.contains(target)
			? target
			: editor.createInside.element('a');

	link.setAttribute('href', buildMailto(fields));

	if (link.textContent !== label) {
		link.textContent = label;
	}

	if (options.className) {
		link.classList.add(...options.className.split(/\s+/).filter(Boolean));
	}

	if (link !== target) {
		editor.s.insertNode(link, false, false);
		editor.s.setCursorAfter(link);
	}

	editor.synchronizeValues();
}
