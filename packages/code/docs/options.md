# Options

Settings go into the `code` option of the editor. Every key is optional; the values below are the defaults.

```js
Jodit.make('#editor', {
	code: {
		languages: [],
		defaultLanguage: 'auto',
		lineNumbers: false,
		header: true,
		download: false,
		native: false,
		indent: '\t',
		tabSize: 4,
		className: ''
	}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `languages` | `string[]` | `[]` | Languages offered in the dialog, in this order, as highlight.js names (`'javascript'`, `'python'`, …). Empty: every registered language, sorted by name. |
| `defaultLanguage` | `string` | `'auto'` | Language selected for a new block. `'auto'` detects it from the code. After the first block, the dialog offers the language chosen last. |
| `lineNumbers` | `boolean` | `false` | Line numbers in a new block. Each block can switch them in the dialog. |
| `header` | `boolean` | `true` | The header with the language in a new block. The copy and download buttons are in the header, so a block without it has none. Each block can switch it in the dialog and its toolbar. |
| `download` | `boolean` | `false` | Offer the code of a new block as a file to download; needs the header. Each block can switch it in the dialog. |
| `native` | `boolean` | `false` | Save the code of a new block as plain text for the highlighter of the site (the frame and the header stay), see [Site highlighting](#site-highlighting). Each block can switch it in the dialog and its toolbar. |
| `indent` | `string` | `'\t'` | What the Tab key inserts in the code field, for example `'  '` for two spaces. Shift+Tab removes it from the selected lines. |
| `tabSize` | `number` | `4` | Width of a tab character in the block, in spaces. |
| `className` | `string` | `''` | CSS classes added to inserted blocks, separated by spaces. |

## Languages

The plugin includes the common languages of highlight.js: Bash, C, C#, C++, CSS, Diff, Go, GraphQL, INI/TOML, Java, JavaScript, JSON, Kotlin, Less, Lua, Makefile, Markdown, Objective-C, Perl, PHP, Plain text, Python, R, Ruby, Rust, SCSS, Shell, SQL, Swift, TypeScript, Visual Basic .NET, WebAssembly, HTML/XML, YAML and a few more.

Other languages of highlight.js can be added. With a bundler:

```js
import { registerLanguage } from 'jodit-plugin-code';
import dart from 'highlight.js/lib/languages/dart';

registerLanguage('dart', dart);
```

Automatic detection works best on a few lines of code or more; on a short snippet it can pick a wrong language, so choose the language when you know it.

## Markup

A block is saved as HTML like this (inline styles shortened):

```html
<div class="jodit-code" data-lang="javascript" data-download="" style="…">
	<div class="jodit-code__header" style="…">
		<span class="jodit-code__lang" style="…">JavaScript</span>
	</div>
	<div class="jodit-code__body" style="…">
		<pre class="jodit-code__lines" aria-hidden="true" style="…">1
2</pre>
		<pre class="jodit-code__pre" style="…"><code class="jodit-code__code nohighlight nohljsln" data-lang="javascript" style="…"><span class="jodit-code__keyword" style="color:var(--jodit-code-keyword,#cf222e)">const</span> a = 1;
…</code></pre>
	</div>
</div>
```

- `data-lang` on the block and on `<code>` holds the language.
- `<code>` has the `nohighlight` and `nohljsln` classes and no `language-*` class on purpose: highlight.js, its line numbers plugin and Prism on the site skip the block, see [Next to other code tools](#next-to-other-code-tools).
- `jodit-code__header` is there only with the header, see [Header](#header).
- `jodit-code__lines` is there only with line numbers.
- `data-download` is there only when the block offers its code as a file; its value is the file name, empty for `Untitled.<ext>`.
- The code itself is the text of `<code>`: the plugin reads it from there when the block is edited, so no other data is stored.

If your server cleans the HTML, it must keep `div`, `span`, `pre` and `code` with their `class`, `style`, `data-lang`, `data-download` and `aria-hidden` attributes. Without `style` the blocks still have their classes and can be styled by the site, see [Styling](styling.md).

## Header

The header shows the language of the block and holds its copy and download buttons, in the editor and, with the [runtime](runtime.md), on the site. "Header" in the dialog and the button with the header in the toolbar of the block switch it:

- **On** (the default): the header with the language and the copy button; with "Download as a file", the download button too.
- **Off**: the frame and the code only. There is nowhere for the buttons, so the block has no copy or download button, and "Download as a file" is hidden in the dialog; switching the header off in the toolbar also stops offering the file. Copy the code in the editor with the copy button of the block toolbar.

`header: false` leaves the header out of new blocks.

## Site highlighting

Each block is saved in one of two ways, switched by "Site highlighting" in the dialog and by the button with the drop in the toolbar of the block:

- **Off** (the default): the block with its own highlighting in inline styles, as shown under [Markup](#markup). It looks the same on any site, without CSS or scripts; highlighters of the site leave it alone.
- **On**: the same block with its frame and header, and the code as plain text for the highlighter of the site, such as highlight.js or Prism, which colors it with the theme of the site:

    ```html
    <div class="jodit-code" data-lang="javascript" data-native="" style="…">
    	<div class="jodit-code__header" style="…">
    		<span class="jodit-code__lang" style="…">JavaScript</span>
    	</div>
    	<div class="jodit-code__body" style="…">
    		<pre class="jodit-code__pre" style="…"><code class="language-javascript" style="…">const a = 1;</code></pre>
    	</div>
    </div>
    ```

    The header, the border, the line numbers and the [runtime](runtime.md) copy and download buttons stay as in the other blocks. With the line numbers of the block, `<code>` also gets the `nohljsln` class, so that the line numbers plugin of highlight.js does not add a second column; without them, that plugin may number the code. The code has no colors and no background of its own: they come from the theme of the highlighter, and its padding keeps the code clear of the border without a highlighter too. Without a highlighter on the site the code is plain preformatted text in the frame.

In the editor both look the same, with the highlighting and the toolbar of the plugin, so editing does not depend on the site. `data-native` keeps the block this way when the HTML is edited again. A language detected with "Auto detect" is written to the class.

The header keeps its own colors, which may differ from the theme of the highlighter; set them with the [variables](styling.md#variables) `--jodit-code-header-background`, `--jodit-code-header-color` and `--jodit-code-border`, for example next to a dark theme.

`native: true` makes "Site highlighting" the default for new blocks, for sites that load a highlighter anyway:

```js
Jodit.make('#editor', {
	code: { native: true }
});
```

## Download as a file

Switch on "Download as a file" in the dialog to offer the code of the block as a file. A "File name" field appears; it is optional:

- empty: the file is `Untitled.<ext>`, with the extension of the language (`Untitled.py`, `Untitled.ts`, `Untitled.txt` for plain text);
- a name without an extension gets the one of the language: `report` becomes `report.py`;
- a name with an extension is kept: `editor.d.ts`.

The header of the block gets a download button next to the copy button, in the editor and, with the [runtime](runtime.md), on the site.

## Editing

- **Double-click** a block to open the dialog with its code, language, line numbers and file settings.
- **Click** a block to select it and show its toolbar: the language (choose another one to highlight the code again), line numbers on and off, the [header](#header) on and off, [site highlighting](#site-highlighting) on and off, edit, copy the code, delete. The language list is the one of the dialog, see `languages`. Delete and Backspace remove a selected block.
- The **copy and download buttons** in the header of a block work in the editor too; they are added in the editor only and are not saved with the HTML.
- With the caret inside a plain `<pre>` (for example from pasted HTML), the code button opens the dialog with its text, and "Update" turns it into a highlighted block. The language is taken from a `language-*` or `lang-*` class if there is one. With Jodit PRO, plain `<pre>` blocks are left to its code plugin.

In the editor a block cannot be edited in place: changes go through the dialog, so the highlighting always matches the code.

## Next to other code tools

### highlight.js or Prism on the site

A block brings its highlighting with it, so a site needs no highlighter for it. To have the highlighter of the site color a block instead, switch on [Site highlighting](#site-highlighting). When the site has a highlighter, it skips the other blocks: `<code>` has the `nohighlight` class and no `language-*` class, which is how highlight.js and Prism decide what to highlight. The blocks keep their look, and highlight.js logs no warnings about them.

highlight.js has no line numbers or copy button of its own; sites add them with plugins. [highlightjs-line-numbers.js](https://github.com/wcoder/highlightjs-line-numbers.js/) numbers every `code.hljs` and `code.nohighlight`, so the blocks carry its opt-out class `nohljsln`: blocks with their own colors always, blocks with site highlighting when they have their own line numbers. A copy button plugin such as [highlightjs-copy](https://github.com/highlightjs-plugins/highlightjs-copy) adds its button to the highlighted code, so blocks with site highlighting and a header get two; on such a site, switch the [header](#header) off or leave the copying to the plugin. Code that the site highlights itself, such as `<pre><code class="language-js">`, is not affected.

Blocks saved by version 1.2 and earlier get `nohighlight` and `nohljsln` (in place of a `language-*` class of version 1.1 and earlier) when they are saved again.

### Jodit PRO

Jodit PRO has its own code plugin, `pasteCode`, with the `pasteCode` button.

- **The `pasteCode` button is in the toolbar**: this plugin turns itself off in that editor, leaving code blocks to Jodit PRO, and says so in the console:

    ```text
    jodit-plugin-code: the "pasteCode" button of Jodit PRO is in the toolbar, so the code plugin is off in this editor
    ```

    The `code` button, if it is in the toolbar too, is disabled. To use this plugin instead, remove `pasteCode` from the buttons or add it to `disablePlugins`.

- **Jodit PRO without the `pasteCode` button**: both plugins work. Blocks of this plugin keep their highlighting, toolbar and dialog, those with site highlighting too; plain `<pre>` blocks belong to Jodit PRO. In the editor a block holds its code in `<div>` elements, so Jodit PRO does not take it for its own; the saved HTML has `<pre>` as usual.

## Translations

The dialog follows the editor `language` option. English, German (`de`) and Russian (`ru`) are included. Other languages can be added to `Jodit.lang`; the strings are:

```js
Jodit.lang.fr = {
	...Jodit.lang.fr,
	'Insert code': 'Insérer du code',
	'Edit code': 'Modifier le code',
	'Copy code': 'Copier le code',
	'Delete code': 'Supprimer le code',
	Language: 'Langage',
	'Auto detect': 'Détection automatique',
	'Line numbers': 'Numéros de ligne',
	'Download as a file': 'Télécharger comme fichier',
	'File name': 'Nom du fichier',
	Download: 'Télécharger',
	Code: 'Code',
	Preview: 'Aperçu',
	Insert: 'Insérer',
	Update: 'Mettre à jour',
	Cancel: 'Annuler',
	Copied: 'Copié',
	'Paste or type the code': 'Collez ou saisissez le code',
	Header: 'En-tête',
	'Header with the language and the copy and download buttons': 'En-tête avec le langage et les boutons copier et télécharger',
	'Site highlighting': 'Coloration du site',
	'Save as plain code for the highlighter of the site (highlight.js, Prism)': 'Enregistrer en code brut pour la coloration du site (highlight.js, Prism)',
	'Use the highlighting of the site': 'Utiliser la coloration du site',
	'The block is saved as plain code for the highlighter of the site': 'Le bloc est enregistré en code brut pour la coloration du site',
	'The block is saved with its own highlighting': 'Le bloc est enregistré avec sa propre coloration'
};
```
