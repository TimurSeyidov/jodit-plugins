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
.jodit-datagen__row .jodit-ui-input { flex: 0 0 110px; }
.jodit-datagen__row .jodit-ui-select, .jodit-datagen__row .jodit-ui-block__text { flex: 0 0 220px; }
.jodit-datagen__row .jodit-ui-input__wrapper { min-width: 0; }
.jodit-datagen__row .jodit-ui-button { align-self: flex-end; }
.jodit-datagen__hint { font-size: 11px; opacity: 0.7; margin-top: 2px; }
.jodit-datagen__template { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 12px; height: 250px; }
.jodit-datagen__parts { display: flex; flex-direction: column; gap: 4px; min-height: 0; }
.jodit-datagen__parts .jodit-ui-block { margin-bottom: 0; }
.jodit-datagen__parts textarea { width: 100%; box-sizing: border-box; resize: vertical; font: 12px/1.4 ${MONO}; }
.jodit-datagen__fields { overflow: auto; font-size: 12px; border-left: 1px solid rgba(127, 127, 127, 0.25); padding-left: 8px; }
.jodit-datagen__fields h4 { margin: 4px 0; font-size: 12px; }
.jodit-datagen__field {
	display: block; width: 100%; text-align: left; padding: 2px 4px; border: 0; border-radius: 3px;
	background: none; color: inherit; font: inherit; cursor: pointer;
}
.jodit-datagen__field:hover { background: rgba(127, 127, 127, 0.15); }
.jodit-datagen code { font: 12px ${MONO}; }
.jodit-datagen__field span { display: block; opacity: 0.7; }
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
