# jodit-plugin-code

[![npm version](https://img.shields.io/npm/v/jodit-plugin-code)](https://www.npmjs.com/package/jodit-plugin-code)
[![npm downloads](https://img.shields.io/npm/dm/jodit-plugin-code)](https://www.npmjs.com/package/jodit-plugin-code)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/jodit-plugin-code)](https://www.jsdelivr.com/package/npm/jodit-plugin-code)
[![CI](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/TimurSeyidov/jodit-plugins/graph/badge.svg)](https://codecov.io/gh/TimurSeyidov/jodit-plugins)
[![License: MIT](https://img.shields.io/npm/l/jodit-plugin-code)](https://github.com/TimurSeyidov/jodit-plugins/blob/main/LICENSE)

Code blocks with syntax highlighting for the [Jodit](https://xdsoft.net/jodit/) editor: choose a language, paste the code, check the preview and insert. Blocks carry inline styles written as CSS variables, so they look right on any site without CSS and can be recolored with variables. Line numbers and "download as a file" are optional; copy and download buttons work in the editor, and a 2 KB runtime adds them on the site.

![Inserting a code block with the preview](https://timurseyidov.github.io/jodit-plugins/plugins/code/media/code.gif)

**[Documentation and live demo](https://timurseyidov.github.io/jodit-plugins/plugins/code/)**

## Install

```shell
npm install jodit jodit-plugin-code
```

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-code';

Jodit.make('#editor', {
	code: { lineNumbers: true }
});
```

On the pages that show the content:

```js
import { enhance } from 'jodit-plugin-code/runtime';

enhance();
```

## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-code@1/dist/es2021/plugins/code/code.min.js"></script>

<!-- on the pages that show the content -->
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-code@1/dist/es2021/plugins/code/code-runtime.min.js" defer></script>
```

The browser build already contains highlight.js with the common languages.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `languages` | `[]` (all) | Languages offered in the dialog, as highlight.js names |
| `defaultLanguage` | `'auto'` | Language of a new block, `'auto'` to detect it |
| `lineNumbers` | `false` | Line numbers in a new block |
| `download` | `false` | Offer the code of a new block as a file (`Untitled.<ext>` or a given name) |
| `indent` | `'\t'` | What Tab inserts in the code field |
| `tabSize` | `4` | Width of a tab in the block |
| `className` | `''` | CSS classes for inserted blocks |

Details: [Options](https://timurseyidov.github.io/jodit-plugins/plugins/code/options/), [Styling](https://timurseyidov.github.io/jodit-plugins/plugins/code/styling/), [Runtime](https://timurseyidov.github.io/jodit-plugins/plugins/code/runtime/).

## Changelog

See [CHANGELOG.md](https://github.com/TimurSeyidov/jodit-plugins/blob/main/packages/code/CHANGELOG.md) or the [releases](https://github.com/TimurSeyidov/jodit-plugins/releases).

## License

[MIT](https://github.com/TimurSeyidov/jodit-plugins/blob/main/LICENSE)
