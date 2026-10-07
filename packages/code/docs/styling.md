# Styling

Every part of a block carries its look in inline styles, so the block looks the same on any page, in an email or in a CMS where you cannot add CSS. The colors, fonts and the radius are written as CSS variables with a default value:

```html
<span class="jodit-code__keyword" style="color:var(--jodit-code-keyword,#cf222e)">const</span>
```

Without any CSS the default (`#cf222e`) is used. To change it, set the variable on the blocks of your site; no `!important` is needed:

```css
.jodit-code {
	--jodit-code-keyword: #d73a49;
	--jodit-code-border: #e1e4e8;
	--jodit-code-radius: 10px;
}
```

## Variables

| Variable | Default | What it colors |
| --- | --- | --- |
| `--jodit-code-background` | `#f6f8fa` | Code area |
| `--jodit-code-color` | `#1f2328` | Text without a token |
| `--jodit-code-border` | `#d0d7de` | Border of the block and of the header |
| `--jodit-code-radius` | `6px` | Corner radius |
| `--jodit-code-header-background` | `#eaeef2` | Header |
| `--jodit-code-header-color` | `#57606a` | Language name |
| `--jodit-code-header-font` | system sans-serif | Font of the header |
| `--jodit-code-font` | system monospace | Font of the code and of the line numbers |
| `--jodit-code-line-number` | `#8c959f` | Line numbers |
| `--jodit-code-keyword` | `#cf222e` | Keywords |
| `--jodit-code-string` | `#0a3069` | Strings |
| `--jodit-code-number` | `#0550ae` | Numbers, literals (`true`, `null`) |
| `--jodit-code-comment` | `#6e7781` | Comments (also italic) |
| `--jodit-code-title` | `#8250df` | Names of functions and classes, headings, CSS selectors |
| `--jodit-code-type` | `#953800` | Types and built-ins |
| `--jodit-code-attr` | `#0550ae` | Attributes and properties |
| `--jodit-code-tag` | `#116329` | Tags and element names |
| `--jodit-code-variable` | `#953800` | Variables |
| `--jodit-code-meta` | `#0550ae` | Meta (preprocessor, doctype) |
| `--jodit-code-regexp` | `#116329` | Regular expressions |
| `--jodit-code-addition`, `--jodit-code-addition-background` | `#116329`, `#dafbe1` | Added lines of a diff |
| `--jodit-code-deletion`, `--jodit-code-deletion-background` | `#82071e`, `#ffebe9` | Removed lines of a diff |
| `--jodit-code-copy-hover` | translucent gray | Copy and download buttons under the pointer |

## Classes

| Class | Element |
| --- | --- |
| `jodit-code` | The block; also gets the classes of the `className` option |
| `jodit-code__header` | Header |
| `jodit-code__lang` | Language name in the header |
| `jodit-code__copy` | Copy button, added by the runtime and in the editor |
| `jodit-code__download` | Download button of a block offered as a file |
| `jodit-code__body` | Line numbers and code |
| `jodit-code__lines` | Line numbers |
| `jodit-code__pre`, `jodit-code__code` | `<pre>` and `<code>`; in the editor `jodit-code__pre` and `jodit-code__lines` are `<div>`, so select them by class |
| `jodit-code__<kind>` | Tokens: `keyword`, `string`, `number`, `comment`, `title`, `type`, `attr`, `tag`, `variable`, `meta`, `regexp`, `addition`, `deletion`; other highlight.js scopes keep their name, such as `jodit-code__params` |

Classes are the way to change what is not a variable, such as paddings or the font size. Inline styles win over classes, so such rules need `!important`:

```css
.jodit-code__pre { padding: 20px 24px !important; font-size: 14px !important; }
```

## A dark theme for the site

Variables are enough to make the blocks dark, for example in the dark mode of the site:

```css
@media (prefers-color-scheme: dark) {
	.jodit-code {
		--jodit-code-background: #22272e;
		--jodit-code-color: #adbac7;
		--jodit-code-border: #444c56;
		--jodit-code-header-background: #2d333b;
		--jodit-code-header-color: #909dab;
		--jodit-code-line-number: #636e7b;
		--jodit-code-keyword: #f47067;
		--jodit-code-string: #96d0ff;
		--jodit-code-number: #6cb6ff;
		--jodit-code-comment: #768390;
		--jodit-code-title: #dcbdfb;
		--jodit-code-type: #f69d50;
		--jodit-code-attr: #6cb6ff;
		--jodit-code-tag: #8ddb8c;
		--jodit-code-variable: #f69d50;
		--jodit-code-meta: #6cb6ff;
		--jodit-code-regexp: #8ddb8c;
	}
}
```

The same variables can be set on the editor, for example `editor.container.style.setProperty('--jodit-code-keyword', '#d73a49')`, to see the blocks in the colors of the site while editing; see the [examples](examples.md).
