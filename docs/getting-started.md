# Getting started

Every package in this collection is named `jodit-plugin-<name>` and ships two builds:

- `dist/index.mjs`: an ES module for bundlers. Importing it registers the plugin in the `Jodit` class from the `jodit` package.
- `dist/<build>/plugins/<name>/<name>.min.js`: a standalone script for the browser, in three builds: `es2021`, `es2018` and `es2015`. It registers the plugin in `window.Jodit` and already contains the libraries the plugin needs.

The examples below use the QR code plugin; replace `qrcode` with the name of another plugin.

## With a bundler

Install Jodit and the plugin:

```shell
npm install jodit jodit-plugin-qrcode
```

Import the plugin once, anywhere before the editor is created:

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-qrcode';

Jodit.make('#editor');
```

The plugin adds its button to the toolbar. If you set your own `buttons` list, add the button name there, for example `buttons: ['bold', 'italic', '|', 'qrcode']`.

!!! note "One copy of Jodit"
    `jodit` is a peer dependency of every plugin: the plugin registers itself in the copy of Jodit your application imports. If your setup still ends up with two copies (for example, a wrapper that bundles its own Jodit), register the plugin explicitly in the class you use:

    ```js
    import { Jodit } from 'jodit';
    import { registerQrCode } from 'jodit-plugin-qrcode';

    registerQrCode(Jodit);
    ```

## With a script tag

Load the plugin after Jodit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js"></script>

<textarea id="editor"></textarea>
<script>
	Jodit.make('#editor');
</script>
```

The same file is available from unpkg: `https://unpkg.com/jodit-plugin-qrcode@0/dist/es2021/plugins/qrcode/qrcode.min.js`. Pin an exact version in production, for example `jodit-plugin-qrcode@0.1.0`.

### Builds

The plugins are built for the same JavaScript versions as Jodit, in folders with the same names. Load the plugin from the folder that matches your Jodit build:

| Plugin folder | For | Jodit build |
| --- | --- | --- |
| `dist/es2021/` | current browsers (recommended) | `jodit/es2021/`, `jodit/es2021.en/` |
| `dist/es2018/` | browsers from 2018–2020 | `jodit/es2018/` |
| `dist/es2015/` | older browsers with ES2015 support | `jodit/es2015/` |

Only the syntax is converted for older versions; browser APIs are not polyfilled, the same as in Jodit. There is no ES5 build.

## With `extraPlugins`

Jodit can download a plugin by itself when the editor starts. Pass the script URL:

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

Or copy `dist/es2021/plugins/qrcode/` (or the folder of your build) into the `plugins/` folder next to your Jodit files and use the name only. Jodit then loads `<basePath>plugins/qrcode/qrcode.min.js`:

```js
Jodit.make('#editor', {
	basePath: '/assets/jodit/',
	extraPlugins: ['qrcode']
});
```

Jodit detects `basePath` from the `<script>` tag that loaded it. With a bundler there is no such tag, so set `basePath` explicitly, with a trailing slash.

## Turning a plugin off

A registered plugin can be turned off for a single editor:

```js
Jodit.make('#editor', {
	disablePlugins: ['qrcode']
});
```
