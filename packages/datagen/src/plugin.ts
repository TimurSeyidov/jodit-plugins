import type { Jodit as JoditType } from 'jodit';
import type { IControlType, IJodit } from 'jodit/types/types/index.js';

import { openDialog } from './dialog.js';
import icon from './icon.svg';
import { langs } from './langs/index.js';
import { defaultOptions } from './options.js';

/** Name of the plugin, the toolbar button and the icon */
export const NAME = 'datagen';

type JoditStatic = typeof JoditType;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const STYLES = `
.jodit-datagen-dialog .jodit-dialog__content { display: flex; flex-direction: column; }
.jodit-datagen-dialog:not(.jodit-dialog_fullsize_true) .jodit-datagen { width: min(860px, calc(100vw - 64px)); }
.jodit-datagen { display: flex; flex: 1; flex-direction: column; gap: 8px; box-sizing: border-box; padding: 8px 12px; }
.jodit-datagen .jodit-tabs { flex: none; }
.jodit-datagen .jodit-tab_active { display: block; }
.jodit-datagen__row { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px 12px; margin-bottom: 8px; }
.jodit-datagen__row > * { margin-bottom: 0; }
.jodit-datagen__row > .jodit-ui-button { margin-top: 15px; }
.jodit-datagen__row:first-child { margin-bottom: 22px; }
.jodit-datagen__row .jodit-ui-input { flex: 0 0 110px; }
.jodit-datagen__row .jodit-ui-select, .jodit-datagen__row .jodit-ui-block__text { flex: 0 0 220px; }
.jodit-datagen__row .jodit-ui-input__wrapper { min-width: 0; }
.jodit-datagen__row .jodit-ui-block__count { position: relative; }
.jodit-datagen__hint { position: absolute; top: 100%; left: 0; margin-top: 3px; font-size: 11px; opacity: 0.7; white-space: nowrap; }
.jodit-datagen__about { margin: 4px 0 8px; font-size: 12px; line-height: 1.5; opacity: 0.85; }
.jodit-datagen__link { padding: 0; border: 0; background: none; color: var(--jd-color-primary, #1e88e5); font: inherit; cursor: pointer; }
.jodit-datagen__link:hover { text-decoration: underline; }
.jodit-datagen__template { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 12px; height: 250px; }
.jodit-datagen__parts { display: flex; flex-direction: column; gap: 4px; min-height: 0; }
.jodit-datagen__parts .jodit-ui-block { margin-bottom: 0; }
.jodit-datagen__code-box { position: relative; align-items: stretch; }
.jodit-datagen__code, .jodit-datagen__layer {
	box-sizing: border-box; margin: 0; padding: 4px 8px; font: 12px/1.5 ${MONO}; tab-size: 4;
	white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; letter-spacing: normal;
}
.jodit-datagen .jodit-datagen__code {
	position: relative; z-index: 1; width: 100%; resize: vertical; background: transparent;
	-webkit-text-fill-color: transparent;
}
.jodit-datagen__layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; pointer-events: none; background: none; border: 0; }
.jodit-datagen__code, .jodit-datagen__layer { color: #1f2328; }
.jodit-datagen__code-box_dark .jodit-datagen__code, .jodit-datagen__code-box_dark .jodit-datagen__layer { color: #e6edf3; }
.jodit-datagen-hl__tag { color: #0550ae; }
.jodit-datagen-hl__attribute { color: #8250df; }
.jodit-datagen-hl__string { color: #0a3069; }
.jodit-datagen-hl__comment { color: #6e7781; font-style: italic; }
.jodit-datagen-hl__brace, .jodit-datagen-hl__field { color: #953800; background: rgba(255, 170, 0, 0.14); }
.jodit-datagen-hl__filter { color: #cf222e; background: rgba(255, 170, 0, 0.14); }
.jodit-datagen-hl__argument { color: #116329; background: rgba(255, 170, 0, 0.14); }
.jodit-datagen__layer mark { color: inherit; background: none; text-decoration: underline wavy #d32f2f; text-underline-offset: 3px; }
.jodit-datagen__layer mark.jodit-datagen-hl__warning { text-decoration-color: #ed9c00; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__tag { color: #7ee787; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__attribute { color: #d2a8ff; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__string { color: #a5d6ff; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__comment { color: #8b949e; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__brace, .jodit-datagen__code-box_dark .jodit-datagen-hl__field { color: #ffa657; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__filter { color: #ff7b72; }
.jodit-datagen__code-box_dark .jodit-datagen-hl__argument { color: #7ee787; }
.jodit-datagen__fields { overflow: auto; font-size: 12px; border-left: 1px solid rgba(127, 127, 127, 0.25); padding-left: 8px; }
.jodit-datagen__fields h4 { margin: 10px 0 6px; font-size: 12px; }
.jodit-datagen__fields h4:first-child { margin-top: 2px; }
.jodit-datagen__field {
	display: block; width: 100%; text-align: left; margin-bottom: 2px; padding: 5px 6px; border: 0; border-radius: 4px; line-height: 1.35;
	background: none; color: inherit; font: inherit; cursor: pointer;
}
.jodit-datagen__field:hover { background: rgba(127, 127, 127, 0.15); }
.jodit-datagen code { font: 12px ${MONO}; }
.jodit-datagen__field span { display: block; margin-top: 1px; opacity: 0.7; }
.jodit-datagen__help { height: 250px; overflow: auto; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.jodit-datagen__help h4 { margin: 8px 0 4px; }
.jodit-datagen__help table { border-collapse: collapse; width: 100%; }
.jodit-datagen__help td, .jodit-datagen__help th { border: 1px solid rgba(127, 127, 127, 0.3); padding: 2px 6px; text-align: left; vertical-align: top; }
.jodit-datagen__problems { margin: 0; padding: 0; list-style: none; font-size: 12px; }
.jodit-datagen__problem { padding: 2px 6px; border-radius: 3px; cursor: pointer; color: #b3261e; background: rgba(211, 47, 47, 0.08); margin-bottom: 2px; }
.jodit-datagen__problem_warning { color: #8a5a00; background: rgba(237, 160, 0, 0.12); }
.jodit-datagen__status { font-size: 12px; min-height: 16px; }
.jodit-datagen__status_error { color: #b3261e; }
.jodit-datagen__preview { flex: 1; min-height: 160px; width: 100%; border: 1px solid rgba(127, 127, 127, 0.3); background: #fff; }
.jodit-datagen__notice { font-size: 12px; opacity: 0.75; }
`;

const registered = new WeakSet<JoditStatic>();

/**
 * Registers the data generation plugin, its toolbar button, icon, default options and translations in the given
 * Jodit class. Calling it again for the same class does nothing.
 */
export function registerDatagen(Jodit: JoditStatic): void {
	// The plugin registry of Jodit also catches a second copy of this
	// script on the page
	if (registered.has(Jodit) || Jodit.plugins.get(NAME)) {
		return;
	}

	registered.add(Jodit);

	Jodit.modules.Icon.set(NAME, icon);

	const config = Jodit.defaultOptions;
	config.datagen = { ...defaultOptions, ...config.datagen };
	config.controls[NAME] = {
		icon: NAME,
		tooltip: 'Generate data',
		exec: (editor: IJodit) => openDialog(Jodit, editor)
	} as IControlType;

	Object.entries(langs).forEach(([code, dictionary]) => {
		Jodit.lang[code] = { ...Jodit.lang[code], ...dictionary };
	});

	class DatagenPlugin extends Jodit.modules.Plugin {
		override buttons = [{ name: NAME, group: 'insert' as const }];

		override styles = STYLES;

		protected afterInit(): void {}

		protected beforeDestruct(): void {}
	}

	Jodit.plugins.add(NAME, DatagenPlugin);
}
