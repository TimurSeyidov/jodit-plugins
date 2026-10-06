# Installation

## npm

```shell
npm install jodit jodit-plugin-qrcode
```

The [qrcode](https://www.npmjs.com/package/qrcode) library is a dependency of the plugin and is installed with it; you do not need to install it separately. `jodit` is a peer dependency: the plugin works with the Jodit version your project uses (4.x).

Import the plugin once, before the editor is created. The import registers the plugin, its toolbar button and icon in the imported `Jodit` class:

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-qrcode';

Jodit.make('#editor');
```

If your project has more than one copy of Jodit (for example, a wrapper component that bundles its own), register the plugin in the class you actually use:

```js
import { Jodit } from 'jodit';
import { registerQrCode } from 'jodit-plugin-qrcode';

registerQrCode(Jodit);
```

Calling `registerQrCode` more than once for the same class does nothing.

### TypeScript

The package ships type declarations. Importing it adds the `qrcode` option to the Jodit `Config` type, so `Jodit.make('#editor', { qrcode: { size: 300 } })` is type-checked. The options interface is exported as `QrCodeOptions`.

## CDN

The browser build is a single file that already contains the qrcode library. Load it after Jodit, from the same build folder as Jodit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js"></script>
```

=== "jsDelivr"

    ```text
    https://cdn.jsdelivr.net/npm/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js
    ```

=== "unpkg"

    ```text
    https://unpkg.com/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js
    ```

`@0` takes the latest 0.x version; pin an exact one in production, for example `jodit-plugin-qrcode@0.1.0`. A non-minified `qrcode.js` is next to `qrcode.min.js`.

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
			name: 'qrcode',
			url: 'https://cdn.jsdelivr.net/npm/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js'
		}
	]
});
```

To host the files yourself, copy the `plugins/` folder of the matching build next to the Jodit files of the same build, for example `node_modules/jodit-plugin-qrcode/dist/es2021/plugins/` next to `node_modules/jodit/es2021/`, and pass only the name:

```text
/assets/jodit/              ← files of jodit/es2021/
├── jodit.min.js
├── jodit.min.css
└── plugins/
    └── qrcode/            ← from jodit-plugin-qrcode/dist/es2021/plugins/
        ├── qrcode.js
        └── qrcode.min.js
```

```js
Jodit.make('#editor', {
	basePath: '/assets/jodit/',
	extraPlugins: ['qrcode']
});
```

`basePath` must end with a slash. Jodit detects it from the `<script>` tag that loaded `jodit.min.js`; with a bundler there is no such tag, so set it explicitly.

## Toolbar button

The plugin adds the `qrcode` button to the "insert" group of the default toolbar. If you set your own `buttons` list, add `'qrcode'` to it:

```js
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'image', 'qrcode']
});
```

When the editor is narrow, Jodit moves part of the toolbar into the "⋮" menu, and the QR code button can end up there. To keep every button visible, turn the adaptive toolbar off:

```js
Jodit.make('#editor', {
	toolbarAdaptive: false
});
```

To keep the plugin loaded but hide it in one editor, use `disablePlugins: ['qrcode']`.
