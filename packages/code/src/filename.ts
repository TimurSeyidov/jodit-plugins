/** File extensions of the highlight.js languages; others use the language name */
const EXTENSIONS: Record<string, string> = {
	bash: 'sh',
	shell: 'sh',
	cpp: 'cpp',
	csharp: 'cs',
	javascript: 'js',
	typescript: 'ts',
	python: 'py',
	'python-repl': 'py',
	kotlin: 'kt',
	markdown: 'md',
	objectivec: 'm',
	perl: 'pl',
	'php-template': 'php',
	plaintext: 'txt',
	ruby: 'rb',
	rust: 'rs',
	vbnet: 'vb',
	wasm: 'wat',
	yaml: 'yml',
	makefile: 'mk'
};

/** Name of a file when none is given, without the extension */
export const DEFAULT_NAME = 'Untitled';

/** File extension for code in `language`, without the dot */
export function extensionOf(language: string): string {
	return EXTENSIONS[language] ?? (language.replace(/[^\w]/g, '') || 'txt');
}

/**
 * Name of the downloaded file: the given name without path separators and characters that file systems reject,
 * `Untitled` when it is empty, with the extension of the language when it has none
 */
export function fileName(language: string, name = ''): string {
	const clean = name
		.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '')
		.trim()
		.replace(/^\.+/, '');
	const base = clean || DEFAULT_NAME;

	return base.includes('.') ? base : `${base}.${extensionOf(language)}`;
}
