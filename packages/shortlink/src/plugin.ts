import type { Jodit as JoditType } from 'jodit';
import type {
	IControlType,
	IJodit,
	IPopup,
	IToolbarButton,
	Nullable
} from 'jodit/types/types/index.js';

import { chosenService, offeredServices } from './choice.js';
import icon from './icon.svg';
import { langs } from './langs/index.js';
import { defaultOptions } from './options.js';
import type { ShortlinkServiceItem } from './options.js';
import { isHttpUrl, isShortUrl, shorten } from './services.js';

/** Name of the plugin, the button of the inline link toolbar and the icon */
export const NAME = 'shortlink';

type JoditStatic = typeof JoditType;

type PopupItems = Array<IControlType | string>;

type PopupFactory = (
	editor: IJodit,
	target: HTMLElement | undefined,
	close: () => void
) => PopupItems | HTMLElement | string;

/** The URL and text fields of the link form, as the built-in template and custom ones mark them */
const URL_INPUT = 'input[data-ref="url_input"], input[ref="url_input"]';
const TEXT_INPUT = 'input[data-ref="content_input"], input[ref="content_input"]';

const STYLES = `
.jodit-shortlink-field { display: flex; align-items: flex-end; gap: 4px; }
.jodit-shortlink-field > :first-child { flex: 1; min-width: 0; }
.jodit-shortlink-field > .jodit-ui-button { flex: none; }
.jodit-shortlink-field > .jodit-ui-select { flex: none; width: auto; margin-bottom: 0; }
.jodit-shortlink-field .jodit-ui-select__wrapper { width: auto; min-width: 0; }
.jodit-shortlink-field .jodit-ui-select__input { width: auto; }
`;

/** Key of the chosen service in the storage of Jodit (localStorage) */
const STORAGE_KEY = 'shortlinkService';

/** The service chosen in each editor */
const chosen = new WeakMap<IJodit, string>();

const registered = new WeakSet<JoditStatic>();

/**
 * Registers the link shortener plugin, its button of the inline link toolbar, icon, default options and translations
 * in the given Jodit class. Calling it again for the same class does nothing.
 */
export function registerShortlink(Jodit: JoditStatic): void {
	// The plugin registry of Jodit also catches a second copy of this
	// script on the page
	if (registered.has(Jodit) || Jodit.plugins.get(NAME)) {
		return;
	}

	registered.add(Jodit);

	Jodit.modules.Icon.set(NAME, icon);

	const config = Jodit.defaultOptions;
	config.shortlink = { ...defaultOptions, ...config.shortlink };

	Object.entries(langs).forEach(([code, dictionary]) => {
		Jodit.lang[code] = { ...Jodit.lang[code], ...dictionary };
	});

	addToLinkToolbar(config);

	class ShortlinkPlugin extends Jodit.modules.Plugin {
		override styles = STYLES;

		protected afterInit(editor: IJodit): void {
			// The link form, whatever template made it: the built-in one, a
			// custom one, or one of the `link.formTemplate` option of an editor
			editor.e.on('afterOpenPopup.shortlink', (popup: IPopup) => {
				const input = popup.container.querySelector<HTMLInputElement>(URL_INPUT);

				if (input) {
					addShortenButton(Jodit, editor, input);
				}
			});
		}

		protected beforeDestruct(editor: IJodit): void {
			editor.e.off('.shortlink');
		}
	}

	Jodit.plugins.add(NAME, ShortlinkPlugin);
}

function isEnabled(editor: IJodit): boolean {
	const disabled = editor.o.disablePlugins;
	const list = Array.isArray(disabled)
		? disabled
		: String(disabled ?? '').split(/[\s,]+/);

	return !list.map(name => name.toLowerCase()).includes(NAME);
}

/** Adds the "Shorten" button next to the URL field of a link form, once */
function addShortenButton(
	Jodit: JoditStatic,
	editor: IJodit,
	input: HTMLInputElement
): void {
	const field = input.closest<HTMLElement>('.jodit-ui-input') ?? input;

	if (field.parentElement?.classList.contains('jodit-shortlink-field')) {
		return;
	}

	const button = new Jodit.modules.UIButton(editor, {
		name: NAME,
		icon: { name: NAME },
		text: 'Shorten',
		tooltip: 'Make a short link with the shortening service',
		variant: 'default'
	});

	const row = editor.c.div('jodit-shortlink-field');
	field.replaceWith(row);
	row.append(field);

	// The services to choose from, between the field and the button
	const services = offeredServices(editor.o.shortlink);

	if (services.length > 1) {
		const select = new Jodit.modules.UISelect(editor, {
			name: 'shortlink_service',
			options: services.map(({ title }) => ({ value: title, text: title })),
			value: currentService(editor).title
		});
		select.nativeInput.title = editor.i18n('Link shortening service');
		editor.e.on(select.nativeInput, 'change', () =>
			chooseService(editor, select.value)
		);
		row.append(select.container);
	}

	row.append(button.container);

	button.onAction(() => {
		const long = input.value.trim();
		const text = input.form?.querySelector<HTMLInputElement>(TEXT_INPUT);

		void run(editor, long, button, short => {
			input.value = short;
			input.dispatchEvent(new Event('input', { bubbles: true }));

			if (text && editor.o.shortlink.replaceText && text.value.trim() === long) {
				text.value = short;
			}

			input.focus();
		});
	});
}

/** Adds the "Shorten link" button after "Edit link" in the inline toolbar of a link */
function addToLinkToolbar(config: JoditStatic['defaultOptions']): void {
	const original = config.popup.a as PopupItems | PopupFactory | undefined;

	if (!original) {
		return;
	}

	const control: IControlType = {
		name: NAME,
		icon: NAME,
		tooltip: 'Shorten link',
		exec: (editor: IJodit, current: Nullable<Node>, { button }: { button: IToolbarButton }) =>
			shortenLink(editor, current, button)
	} as IControlType;

	config.popup.a = ((editor, target, close) => {
		const items =
			typeof original === 'function' ? original(editor, target, close) : original;
		const href = closestLink(editor, target)?.getAttribute('href') ?? '';

		if (
			!Array.isArray(items) ||
			!isEnabled(editor) ||
			!isHttpUrl(href) ||
			isShortUrl(href) ||
			items.some(item => typeof item === 'object' && item.name === NAME)
		) {
			return items;
		}

		const edit = items.findIndex(
			item => item === 'link' || (typeof item === 'object' && item.name === 'link')
		);
		const result = [...items];
		result.splice(edit === -1 ? result.length : edit + 1, 0, withChoice(editor, control));
		return result;
	}) as PopupFactory;
}

/**
 * The button of the link toolbar with the arrow and the list of services when there is a choice: the button uses
 * the chosen service, an item of the list chooses its service and uses it
 */
function withChoice(editor: IJodit, control: IControlType): IControlType {
	const services = offeredServices(editor.o.shortlink);

	if (services.length < 2) {
		return control;
	}

	return {
		...control,
		tooltip: (view: IJodit) =>
			`${view.i18n('Shorten link')}: ${currentService(view).title}`,
		list: services.map(({ title }) => title),
		isChildActive: (view: IJodit, button: IToolbarButton) =>
			button.control.args?.[0] === currentService(view).title,
		childExec: (
			view: IJodit,
			current: Nullable<Node>,
			{ control: item, button }: { control: IControlType; button: IToolbarButton }
		) => {
			chooseService(view, String(item.args?.[0] ?? ''));
			shortenLink(view, current, button);
			// `undefined`: the list and the toolbar close, the answer comes as a message
		}
	} as IControlType;
}

/** Shortens the link that contains `current` in place */
function shortenLink(
	editor: IJodit,
	current: Nullable<Node>,
	button: IToolbarButton
): true | undefined {
	const link = closestLink(editor, current);

	if (!link) {
		return;
	}

	const long = link.getAttribute('href')?.trim() ?? '';

	void run(editor, long, button, short => {
		if (!editor.editor.contains(link)) {
			return;
		}

		link.setAttribute('href', short);

		if (editor.o.shortlink.replaceText && link.textContent?.trim() === long) {
			link.textContent = short;
		}

		editor.synchronizeValues();
		editor.message.success(editor.i18n('Link shortened'), 2000);
		editor.e.fire('hidePopup');
	});

	// Not `undefined`: Jodit would close the toolbar before the answer
	return true;
}

/** The service chosen in `editor`, or remembered in the browser */
function currentService(editor: IJodit): ShortlinkServiceItem {
	const options = editor.o.shortlink;
	let remembered = chosen.get(editor);

	if (remembered === undefined && options.remember) {
		const stored = editor.storage.get<string>(STORAGE_KEY);
		remembered = typeof stored === 'string' ? stored : undefined;
	}

	return chosenService(options, remembered);
}

function chooseService(editor: IJodit, title: string): void {
	chosen.set(editor, title);

	if (editor.o.shortlink.remember) {
		editor.storage.set(STORAGE_KEY, title);
	}
}

/** The link that contains `node`, inside the editor */
function closestLink(
	editor: IJodit,
	node: Nullable<Node> | undefined
): HTMLAnchorElement | null {
	const element =
		node && node.nodeType === Node.ELEMENT_NODE
			? (node as Element)
			: (node?.parentElement ?? null);
	const link = element?.closest('a');

	return link && editor.editor.contains(link) ? link : null;
}

/** Requests the short link of `long` with the button disabled, then calls `done`, or shows the error */
async function run(
	editor: IJodit,
	long: string,
	button: { state: { disabled: boolean } },
	done: (short: string) => void
): Promise<void> {
	if (button.state.disabled) {
		return;
	}

	if (isShortUrl(long)) {
		editor.message.info(editor.i18n('The link is already short'), 2000);
		return;
	}

	button.state.disabled = true;

	try {
		const short = await shorten(long, {
			...editor.o.shortlink,
			service: currentService(editor).service
		});

		if (!editor.isDestructed) {
			done(short);
		}
	} catch (error) {
		if (!editor.isDestructed) {
			editor.message.error(
				editor.i18n(error instanceof Error ? error.message : String(error)),
				5000
			);
		}
	} finally {
		button.state.disabled = false;
	}
}
