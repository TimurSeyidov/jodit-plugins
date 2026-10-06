import type { Jodit as JoditType } from 'jodit';
import type { IControlType, IJodit, Nullable } from 'jodit/types/types/index.js';

import { generate } from './generate.js';
import icon from './icon.svg';
import { langs } from './langs/index.js';
import { defaultOptions } from './options.js';

/** Name of the plugin, the toolbar button and the icon */
export const NAME = 'qrcode';

/** Attribute that keeps the encoded text on the inserted image */
export const ATTRIBUTE = 'data-qrcode';

type JoditStatic = typeof JoditType;

const registered = new WeakSet<JoditStatic>();

/**
 * Registers the QR code plugin, its toolbar button, icon, default options and translations in the given Jodit class.
 * Calling it again for the same class does nothing.
 */
export function registerQrCode(Jodit: JoditStatic): void {
	// The plugin registry of Jodit also catches a second copy of this
	// script on the page
	if (registered.has(Jodit) || Jodit.plugins.get(NAME)) {
		return;
	}

	registered.add(Jodit);

	Jodit.modules.Icon.set(NAME, icon);

	const config = Jodit.defaultOptions;
	config.qrcode = { ...defaultOptions, ...config.qrcode };
	config.controls[NAME] = {
		icon: NAME,
		tooltip: 'Insert QR code',
		isActive: (editor: IJodit) =>
			Boolean(findQrImage(editor, editor.s.current())),
		popup: (editor: IJodit, current: Nullable<Node>, close: () => void) =>
			createForm(Jodit, editor, findQrImage(editor, current), close)
	} as IControlType;

	takeOverImageControls(config);

	Object.entries(langs).forEach(([code, dictionary]) => {
		Jodit.lang[code] = { ...Jodit.lang[code], ...dictionary };
	});

	class QrCodePlugin extends Jodit.modules.Plugin {
		override buttons = [{ name: NAME, group: 'insert' as const }];

		protected afterInit(editor: IJodit): void {
			// Double click on a QR code opens the QR code dialog instead of
			// the image properties dialog
			editor.e.on('openOnDblClick.qrcode', (image: HTMLImageElement) => {
				if (!isEnabled(editor) || !findQrImage(editor, image)) {
					return;
				}

				editor.e.fire('hidePopup');
				openForm(Jodit, editor, image);

				return false;
			});
		}

		protected beforeDestruct(editor: IJodit): void {
			editor.e.off('openOnDblClick.qrcode');
		}
	}

	Jodit.plugins.add(NAME, QrCodePlugin);
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
 * Makes QR codes behave as QR codes in the built-in image UI: the "image" toolbar button is not highlighted on them,
 * and the "edit" button of the inline image toolbar opens the QR code dialog
 */
function takeOverImageControls(config: JoditStatic['defaultOptions']): void {
	const image = config.controls.image as IControlType | undefined;

	if (image) {
		const tags = image.tags ?? ['img'];

		// Replaces the built-in check "the cursor is on any <img>"
		config.controls.image = {
			...image,
			tags: undefined,
			isActive: (editor: IJodit, button) => {
				if (image.isActive?.(editor, button)) {
					return true;
				}

				const current = editor.s.current();
				const element = current
					? closestTag(current, tags, editor.editor)
					: null;

				return Boolean(
					element && !(isEnabled(editor) && findQrImage(editor, element))
				);
			}
		} as IControlType;
	}

	const original = config.popup.img as PopupItems | PopupFactory | undefined;

	if (!original) {
		return;
	}

	config.popup.img = ((editor, target, close) => {
		const items =
			typeof original === 'function'
				? original(editor, target, close)
				: original;

		if (
			!Array.isArray(items) ||
			!isEnabled(editor) ||
			!findQrImage(editor, target ?? null)
		) {
			return items;
		}

		return items.map(item =>
			item === 'pencil' ||
			(typeof item === 'object' && item.name === 'pencil')
				? { name: NAME, icon: 'pencil', tooltip: 'Edit QR code' }
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

/** Opens the QR code dialog in a popup next to `image` */
function openForm(
	Jodit: JoditStatic,
	editor: IJodit,
	image: HTMLImageElement
): void {
	const popup = new Jodit.modules.Popup(editor);
	const close = (): void => {
		popup.close();
	};

	popup
		.setContent(createForm(Jodit, editor, image, close))
		.open(() => Jodit.modules.Helpers.position(image, editor));
}

function findQrImage(
	editor: IJodit,
	current: Nullable<Node>
): HTMLImageElement | null {
	const element =
		current && current.nodeType === Node.ELEMENT_NODE
			? (current as Element)
			: (current?.parentElement ?? null);

	const image = element?.closest(`img[${ATTRIBUTE}]`);

	return image && editor.editor.contains(image)
		? (image as HTMLImageElement)
		: null;
}

function createForm(
	Jodit: JoditStatic,
	editor: IJodit,
	target: HTMLImageElement | null,
	close: () => void
): HTMLElement {
	const { UIForm, UIBlock, UITextArea, UIButton } = Jodit.modules;
	const options = editor.o.qrcode;

	const initial =
		target?.getAttribute(ATTRIBUTE) ??
		(options.useSelection ? (editor.s.sel?.toString().trim() ?? '') : '');

	editor.s.save();

	const preview = editor.c.div('jodit-qrcode__preview');
	preview.style.cssText =
		'display:flex;align-items:center;justify-content:center;min-height:120px;margin:8px 0;font-size:12px;text-align:center';

	let renderId = 0;
	const render = async (text: string): Promise<void> => {
		const id = ++renderId;
		const value = text.trim();

		if (!value) {
			preview.textContent = '';
			return;
		}

		try {
			const src = await generate(value, { ...options, size: 120 });

			if (id === renderId) {
				const image = editor.c.element('img', { src, alt: '' });
				image.style.cssText = 'width:120px;height:120px';
				preview.textContent = '';
				preview.appendChild(image);
			}
		} catch {
			if (id === renderId) {
				preview.textContent = editor.i18n(
					'Could not create a QR code: the text is too long'
				);
			}
		}
	};

	const debouncedRender = editor.async.debounce(render, 200);

	const input = new UITextArea(editor, {
		name: 'text',
		label: 'Text or URL',
		required: true,
		value: initial,
		onChange: (value: string) => debouncedRender(value)
	});

	const buttons = new UIBlock(
		editor,
		[
			new UIButton(editor, {
				name: 'insert',
				type: 'submit',
				variant: 'primary',
				text: target ? 'Update' : 'Insert'
			})
		],
		{ align: 'full' }
	);

	const form = new UIForm(editor, [new UIBlock(editor, [input]), buttons]);
	form.container.classList.add('jodit-qrcode');
	form.container.style.minWidth = '260px';
	form.container.insertBefore(preview, buttons.container);

	form.onSubmit(data => {
		void insert(editor, String(data.text ?? '').trim(), target).then(
			inserted => {
				if (inserted) {
					close();
				} else {
					preview.textContent = editor.i18n(
						'Could not create a QR code: the text is too long'
					);
				}
			}
		);

		return false;
	});

	void render(initial);
	// Focus the input once the popup is shown, unless the user has already
	// clicked into the form
	editor.async.setTimeout(() => {
		if (!form.container.contains(form.container.ownerDocument.activeElement)) {
			input.focus();
		}
	}, 50);

	return form.container;
}

async function insert(
	editor: IJodit,
	text: string,
	target: HTMLImageElement | null
): Promise<boolean> {
	const options = editor.o.qrcode;
	let src: string;

	try {
		src = await generate(text, options);
	} catch {
		return false;
	}

	editor.s.restore();

	const image =
		target && editor.editor.contains(target)
			? target
			: editor.createInside.element('img');

	image.setAttribute('src', src);
	image.setAttribute('alt', text);
	image.setAttribute(ATTRIBUTE, text);
	// An updated code keeps the size the user may have set by resizing it
	if (image !== target) {
		image.setAttribute('width', String(options.size));
		image.setAttribute('height', String(options.size));
	}

	if (options.className) {
		image.classList.add(...options.className.split(/\s+/).filter(Boolean));
	}

	if (image !== target) {
		// Keep the selected text and put the code right after it
		const range = editor.s.range;
		if (!range.collapsed) {
			range.collapse(false);
			editor.s.selectRange(range);
		}

		editor.s.insertNode(image, true, false);
	}

	editor.synchronizeValues();

	return true;
}
