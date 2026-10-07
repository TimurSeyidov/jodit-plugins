# Installation

## npm

```shell
npm install jodit jodit-plugin-shortlink
```

The plugin has no dependencies of its own. `jodit` is a peer dependency: the plugin works with the Jodit version your project uses (4.x).

Import the plugin once, before the editor is created. The import registers the plugin, its button and icon in the imported `Jodit` class:

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-shortlink';

Jodit.make('#editor');
```

If your project has more than one copy of Jodit (for example, a wrapper component that bundles its own), register the plugin in the class you actually use:

```js
import { Jodit } from 'jodit';
import { registerShortlink } from 'jodit-plugin-shortlink';

registerShortlink(Jodit);
```

Calling `registerShortlink` more than once for the same class does nothing.

### TypeScript

The package ships type declarations. Importing it adds the `shortlink` option to the Jodit `Config` type, so `Jodit.make('#editor', { shortlink: { timeout: 5000 } })` is type-checked. The options interface is exported as `ShortlinkOptions`. The package also exports `shorten`, `isHttpUrl` and `isShortUrl` for short links outside the editor, and `ShortlinkError` for the errors of your own service.

## CDN

The browser build is a single file. Load it after Jodit, from the same build folder as Jodit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-shortlink@1/dist/es2021/plugins/shortlink/shortlink.min.js"></script>
```

=== "jsDelivr"

    ```text
    https://cdn.jsdelivr.net/npm/jodit-plugin-shortlink@1/dist/es2021/plugins/shortlink/shortlink.min.js
    ```

=== "unpkg"

    ```text
    https://unpkg.com/jodit-plugin-shortlink@1/dist/es2021/plugins/shortlink/shortlink.min.js
    ```

`@1` takes the latest 1.x version; pin an exact one in production, for example `jodit-plugin-shortlink@1.0.0`. A non-minified `shortlink.js` is next to `shortlink.min.js`.

### Builds

The plugin is built for the same JavaScript versions as Jodit, in folders with the same names. Use the folder of the Jodit build you load:

| Folder | For | Jodit build |
| --- | --- | --- |
| `dist/es2021/` | current browsers (recommended) | `jodit/es2021/` and `jodit/es2021.en/` |
| `dist/es2018/` | browsers from 2018–2020 | `jodit/es2018/` |
| `dist/es2015/` | older browsers with ES2015 support | `jodit/es2015/` |

Only the syntax is converted for older versions; browser APIs (`fetch`, `AbortController`, `URL`) are not polyfilled, the same as in Jodit. There is no ES5 build. With npm and a bundler you do not choose a folder: the bundler compiles the plugin together with your code.

## extraPlugins

Jodit can load the plugin itself when the editor starts:

```js
Jodit.make('#editor', {
	extraPlugins: [
		{
			name: 'shortlink',
			url: 'https://cdn.jsdelivr.net/npm/jodit-plugin-shortlink@1/dist/es2021/plugins/shortlink/shortlink.min.js'
		}
	]
});
```

To host the files yourself, copy the `plugins/` folder of the matching build next to the Jodit files of the same build, for example `node_modules/jodit-plugin-shortlink/dist/es2021/plugins/` next to `node_modules/jodit/es2021/`, and pass only the name:

```text
/assets/jodit/              ← files of jodit/es2021/
├── jodit.min.js
├── jodit.min.css
└── plugins/
    └── shortlink/         ← from jodit-plugin-shortlink/dist/es2021/plugins/
        ├── shortlink.js
        └── shortlink.min.js
```

```js
Jodit.make('#editor', {
	basePath: '/assets/jodit/',
	extraPlugins: ['shortlink']
});
```

`basePath` must end with a slash. Jodit detects it from the `<script>` tag that loaded `jodit.min.js`; with a bundler there is no such tag, so set it explicitly.

## Where the buttons are

The plugin has no toolbar button of its own. It adds:

- the **"Shorten"** button next to the URL field of the link form, which the `link` toolbar button and the "Edit link" button of a link open;
- the **"Shorten link"** button to the toolbar that appears when a link is clicked, after "Edit link". It is shown only for http(s) links that are not short links already.

Keep `link` in your `buttons` list to have the form. To keep the plugin loaded but turn it off in one editor, use `disablePlugins: ['shortlink']`.
