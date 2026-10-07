/**
 * Settings of the code block plugin, available as the `code` editor option
 */
export interface CodeOptions {
	/** Languages offered in the dialog, as highlight.js names; empty for every registered language */
	languages: string[];

	/** Language selected in the dialog for a new block: a highlight.js name, or `'auto'` to detect it */
	defaultLanguage: string;

	/** Show line numbers in a new block */
	lineNumbers: boolean;

	/** Show the header with the language and the copy and download buttons in a new block */
	header: boolean;

	/** Offer the code of a new block as a file to download; needs the header */
	download: boolean;

	/**
	 * Save a new block as plain `<pre><code class="language-*">` for the highlighter of the site (highlight.js,
	 * Prism) instead of the block with inline styles. Each block can be switched in the dialog and its toolbar.
	 */
	native: boolean;

	/** Text inserted by the Tab key in the code field */
	indent: string;

	/** Width of a tab character in the block, in spaces */
	tabSize: number;

	/** CSS classes added to inserted blocks, separated by spaces */
	className: string;
}

export const defaultOptions: CodeOptions = {
	languages: [],
	defaultLanguage: 'auto',
	lineNumbers: false,
	header: true,
	download: false,
	native: false,
	indent: '\t',
	tabSize: 4,
	className: ''
};

declare module 'jodit/types/config.js' {
	interface Config {
		code: CodeOptions;
	}
}
