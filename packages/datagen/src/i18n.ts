import type { IJodit } from 'jodit/types/types/index.js';

/** `text` with `params` in place of its `%s`, in order; unlike `String.replace`, `$` in a param stays as is */
export function format(text: string, params: Array<string | number> = []): string {
	let index = 0;
	return text.replace(/%s/g, match => (index < params.length ? String(params[index++]) : match));
}

/** `text` in the language of the editor, with `params` in place of its `%s` */
export function translate(editor: IJodit, text: string, params: Array<string | number> = []): string {
	return format(editor.i18n(text), params);
}
