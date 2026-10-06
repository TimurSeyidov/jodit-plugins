import type { LanguageFn } from 'highlight.js';
import hljs from 'highlight.js/lib/common';

/** A language of the dialog: its highlight.js name and its display name */
export interface CodeLanguage {
	name: string;
	label: string;
}

/** Name used for the automatic detection of the language */
export const AUTO = 'auto';

/** Language of code that is not highlighted */
export const PLAIN = 'plaintext';

/**
 * Registers a highlight.js language, in addition to the common ones that are included
 */
export function registerLanguage(name: string, language: LanguageFn): void {
	hljs.registerLanguage(name, language);
}

/**
 * Languages known to the highlighter, sorted by display name. With `only`, just those of them, in that order.
 */
export function listLanguages(only: string[] = []): CodeLanguage[] {
	const names = only.length
		? only.filter(name => hljs.getLanguage(name))
		: hljs.listLanguages();

	const list = names.map(name => ({
		name,
		label: hljs.getLanguage(name)?.name ?? name
	}));

	return only.length
		? list
		: list.sort((a, b) => a.label.localeCompare(b.label));
}

/** Display name of a language, or the name itself when it is unknown */
export function languageLabel(name: string): string {
	return hljs.getLanguage(name)?.name ?? name;
}

/**
 * Highlights `code` and returns the highlight.js HTML: escaped text with `<span class="hljs-…">` tokens.
 * `'auto'` detects the language; an unknown language is treated as plain text.
 */
export function highlight(
	code: string,
	language: string
): { language: string; html: string } {
	if (language === AUTO) {
		const result = hljs.highlightAuto(code);
		return { language: result.language ?? PLAIN, html: result.value };
	}

	const known = hljs.getLanguage(language) ? language : PLAIN;

	return {
		language: known,
		html: hljs.highlight(code, { language: known, ignoreIllegals: true }).value
	};
}
