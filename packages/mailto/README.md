# Mailto Jodit plugin

[![npm version](https://img.shields.io/npm/v/jodit-plugin-mailto)](https://www.npmjs.com/package/jodit-plugin-mailto)
[![npm downloads](https://img.shields.io/npm/dm/jodit-plugin-mailto)](https://www.npmjs.com/package/jodit-plugin-mailto)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/jodit-plugin-mailto)](https://www.jsdelivr.com/package/npm/jodit-plugin-mailto)
[![CI](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/jodit-plugin-mailto)](https://github.com/TimurSeyidov/jodit-plugins/blob/main/LICENSE)

Email links for the [Jodit](https://xdsoft.net/jodit/) editor: a toolbar button that inserts `mailto:` links. The dialog has a short form (To, Subject, link text) and an "Additional" tab with every field: To, Cc, Bcc, Subject, Body and the link text. Required fields are configurable, addresses are checked, and existing links can be edited or removed. No dependencies.

**[Documentation and live demo](https://timurseyidov.github.io/jodit-plugins/plugins/mailto/)**

## Install

```shell
npm install jodit jodit-plugin-mailto
```

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-mailto';

Jodit.make('#editor', {
	mailto: { required: { subject: true } }
});
```

## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-mailto/dist/es2021/plugins/mailto/mailto.min.js"></script>
```

Loading through the Jodit `extraPlugins` option is supported too; see [Installation](https://timurseyidov.github.io/jodit-plugins/plugins/mailto/installation/).

## Options

| Option | Default | Description |
| --- | --- | --- |
| `fields` | Subject on both tabs; Cc, Bcc, Body only on "Additional" | Where each field is shown: `'main'` (both tabs), `'additional'` or `false` (hidden) |
| `required` | `{ to: true }` | Fields that must be filled in |
| `multiple` | `true` | Allow several addresses in To, Cc and Bcc |
| `validate` | `true` | Check that addresses look like `name@domain.tld` |
| `useSelection` | `true` | Use the selected text as the link text (and as To if it is an address) |
| `className` | `''` | CSS classes for inserted links |

Details: [Options](https://timurseyidov.github.io/jodit-plugins/plugins/mailto/options/).

## License

[MIT](https://github.com/TimurSeyidov/jodit-plugins/blob/main/LICENSE)
