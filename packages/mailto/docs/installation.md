# Installation

## npm

```shell
npm install jodit jodit-plugin-mailto
```

The plugin has no dependencies of its own. `jodit` is a peer dependency: the plugin works with the Jodit version your project uses (4.x).

Import the plugin once, before the editor is created. The import registers the plugin, its toolbar button and icon in the imported `Jodit` class:

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-mailto';

Jodit.make('#editor');
```

If your project has more than one copy of Jodit (for example, a wrapper component that bundles its own), register the plugin in the class you actually use:

```js
import { Jodit } from 'jodit';
import { registerMailto } from 'jodit-plugin-mailto';

registerMailto(Jodit);
```

Calling `registerMailto` more than once for the same class does nothing.

### TypeScript

The package ships type declarations. Importing it adds the `mailto` option to the Jodit `Config` type, so `Jodit.make('#editor', { mailto: { required: { subject: true } } })` is type-checked. The options interface is exported as `MailtoOptions`. The package also exports `buildMailto` and `parseMailto` for working with `mailto:` links outside the editor.

## CDN

The browser build is a single file. Load it after Jodit, from the same build folder as Jodit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-mailto@1/dist/es2021/plugins/mailto/mailto.min.js"></script>
```

=== "jsDelivr"

    ```text
    https://cdn.jsdelivr.net/npm/jodit-plugin-mailto@1/dist/es2021/plugins/mailto/mailto.min.js
    ```

=== "unpkg"

    ```text
    https://unpkg.com/jodit-plugin-mailto@1/dist/es2021/plugins/mailto/mailto.min.js
    ```

`@1` takes the latest 1.x version; pin an exact one in production, for example `jodit-plugin-mailto@1.0.0`. A non-minified `mailto.js` is next to `mailto.min.js`.

### Builds

The plugin is built for the same JavaScript versions as Jodit, in folders with the same names. Use the folder of the Jodit build you load:

| Folder | For | Jodit build |
| --- | --- | --- |
| `dist/es2021/` | current browsers (recommended) | `jodit/es2021/` and `jodit/es2021.en/` |
| `dist/es2018/` | browsers from 2018–2020 | `jodit/es2018/` |
| `dist/es2015/` | older browsers with ES2015 support | `jodit/es2015/` |

Only the syntax is converted for older versions; browser APIs are not polyfilled, the same as in Jodit. There is no ES5 build. With npm and a bundler you do not choose a folder: the bundler compiles the plugin together with your code.

## extraPlugins

Jodit can load the plugin itself when the editor starts:

```js
Jodit.make('#editor', {
	extraPlugins: [
		{
			name: 'mailto',
			url: 'https://cdn.jsdelivr.net/npm/jodit-plugin-mailto@1/dist/es2021/plugins/mailto/mailto.min.js'
		}
	]
});
```

To host the files yourself, copy the `plugins/` folder of the matching build next to the Jodit files of the same build, for example `node_modules/jodit-plugin-mailto/dist/es2021/plugins/` next to `node_modules/jodit/es2021/`, and pass only the name:

```text
/assets/jodit/              ← files of jodit/es2021/
├── jodit.min.js
├── jodit.min.css
└── plugins/
    └── mailto/            ← from jodit-plugin-mailto/dist/es2021/plugins/
        ├── mailto.js
        └── mailto.min.js
```

```js
Jodit.make('#editor', {
	basePath: '/assets/jodit/',
	extraPlugins: ['mailto']
});
```

`basePath` must end with a slash. Jodit detects it from the `<script>` tag that loaded `jodit.min.js`; with a bundler there is no such tag, so set it explicitly.

## Toolbar button

The plugin adds the `mailto` button to the "insert" group of the default toolbar. If you set your own `buttons` list, add `'mailto'` to it:

```js
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'image', 'mailto']
});
```

When the editor is narrow, Jodit moves part of the toolbar into the "⋮" menu, and the email link button can end up there. To keep every button visible, turn the adaptive toolbar off:

```js
Jodit.make('#editor', {
	toolbarAdaptive: false
});
```

To keep the plugin loaded but hide it in one editor, use `disablePlugins: ['mailto']`.
