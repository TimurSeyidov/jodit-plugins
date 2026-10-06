# Examples

Each example shows the configuration code and the editor it creates.

## Default settings

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'code', '|', 'source']
});
```

## Line numbers and two-space indent

New blocks have line numbers, and Tab in the code field inserts two spaces.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['code', '|', 'source'],
	code: {
		lineNumbers: true,
		indent: '  ',
		tabSize: 2
	}
});
```

## A short list of languages

The dialog offers only these languages, in this order, with Python selected for a new block.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['code', '|', 'source'],
	code: {
		languages: ['python', 'javascript', 'typescript', 'sql', 'bash'],
		defaultLanguage: 'python'
	}
});
```

## Colors of the site

The variables of the blocks are set on the editor, so the blocks look as they will on the site. The same rules go into the CSS of the site, see [Styling](styling.md).

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['code', '|', 'source']
});

Object.entries({
	'--jodit-code-background': '#22272e',
	'--jodit-code-color': '#adbac7',
	'--jodit-code-border': '#444c56',
	'--jodit-code-header-background': '#2d333b',
	'--jodit-code-header-color': '#909dab',
	'--jodit-code-keyword': '#f47067',
	'--jodit-code-string': '#96d0ff',
	'--jodit-code-number': '#6cb6ff',
	'--jodit-code-title': '#dcbdfb',
	'--jodit-code-comment': '#768390'
}).forEach(([name, value]) => editor.container.style.setProperty(name, value));
```

## A plain `<pre>` from pasted HTML

The editor starts with a plain `<pre>`, as HTML pasted from elsewhere has it. Put the caret into it and press the code button: the dialog opens with its code and language, and "Update" turns it into a highlighted block. Then double-click the block to edit it again.

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['code', '|', 'source']
});

editor.value = '<pre><code class="language-python">def greet(name):\n    return f"Hello, {name}!"</code></pre>';
```

## Russian interface

``` { .js .jodit-demo }
Jodit.make('#editor', {
	language: 'ru',
	buttons: ['bold', 'italic', '|', 'code']
});
```
