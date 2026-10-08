# Installation

## npm

```shell
npm install jodit jodit-plugin-datagen
```

The plugin has no dependencies of its own. `jodit` is a peer dependency: the plugin works with the Jodit version your project uses (4.x).

Import the plugin once, before the editor is created. The import registers the plugin, its button and icon in the imported `Jodit` class:

```js
import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-datagen';

Jodit.make('#editor');
```

If your project has more than one copy of Jodit (for example, a wrapper component that bundles its own), register the plugin in the class you actually use:

```js
import { Jodit } from 'jodit';
import { registerDatagen } from 'jodit-plugin-datagen';

registerDatagen(Jodit);
```

Calling `registerDatagen` more than once for the same class does nothing.

### TypeScript

The package ships type declarations. Importing it adds the `datagen` option to the Jodit `Config` type, so `Jodit.make('#editor', { datagen: { maxCount: 20 } })` is type-checked. The options interface is exported as `DatagenOptions`.

The parts of the plugin also work outside the editor, for example to fill a page on the server or in tests:

```js
import { LAYOUTS, checkTemplate, generate, render, TYPES } from 'jodit-plugin-datagen';

const data = await generate('products', { baseUrl: 'https://dummyjson.com', timeout: 10000, count: 3 });
const problems = checkTemplate(LAYOUTS.products.table, TYPES.products);
const html = render(LAYOUTS.products.table, data);
```

`generate` loads and chooses the records, `checkTemplate` lists the problems of a template, `render` makes the HTML. `TYPES` describes the types and their fields, `LAYOUTS` holds the built-in layouts, `FILTERS` the filters.

## CDN

The browser build is a single file. Load it after Jodit, from the same build folder as Jodit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.css">
<script src="https://cdn.jsdelivr.net/npm/jodit@4/es2021/jodit.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-datagen@1/dist/es2021/plugins/datagen/datagen.min.js"></script>
```

=== "jsDelivr"

    ```text
    https://cdn.jsdelivr.net/npm/jodit-plugin-datagen@1/dist/es2021/plugins/datagen/datagen.min.js
    ```

=== "unpkg"

    ```text
    https://unpkg.com/jodit-plugin-datagen@1/dist/es2021/plugins/datagen/datagen.min.js
    ```

`@1` takes the latest 1.x version; pin an exact one in production, for example `jodit-plugin-datagen@1.0.0`. A non-minified `datagen.js` is next to `datagen.min.js`.

### Builds

The plugin is built for the same JavaScript versions as Jodit, in folders with the same names. Use the folder of the Jodit build you load:

| Folder | For | Jodit build |
| --- | --- | --- |
| `dist/es2021/` | current browsers (recommended) | `jodit/es2021/` and `jodit/es2021.en/` |
| `dist/es2018/` | browsers from 2018–2020 | `jodit/es2018/` |
| `dist/es2015/` | older browsers with ES2015 support | `jodit/es2015/` |

Only the syntax is converted for older versions; browser APIs (`fetch`, `AbortController`, `DOMParser`) are not polyfilled, the same as in Jodit. There is no ES5 build. With npm and a bundler you do not choose a folder: the bundler compiles the plugin together with your code.

## extraPlugins

Jodit can load the plugin itself when the editor starts:

```js
Jodit.make('#editor', {
	extraPlugins: [
		{
			name: 'datagen',
			url: 'https://cdn.jsdelivr.net/npm/jodit-plugin-datagen@1/dist/es2021/plugins/datagen/datagen.min.js'
		}
	]
});
```

To host the files yourself, copy the `plugins/` folder of the matching build next to the Jodit files of the same build, for example `node_modules/jodit-plugin-datagen/dist/es2021/plugins/` next to `node_modules/jodit/es2021/`, and pass only the name:

```text
/assets/jodit/              ← files of jodit/es2021/
├── jodit.min.js
├── jodit.min.css
└── plugins/
    └── datagen/           ← from jodit-plugin-datagen/dist/es2021/plugins/
        ├── datagen.js
        └── datagen.min.js
```

```js
Jodit.make('#editor', {
	basePath: '/assets/jodit/',
	extraPlugins: ['datagen']
});
```

`basePath` must end with a slash. Jodit detects it from the `<script>` tag that loaded `jodit.min.js`; with a bundler there is no such tag, so set it explicitly.

## Toolbar button

The plugin adds the `datagen` button to the "insert" group of the default toolbar. With your own `buttons` list, put `'datagen'` where you want it:

```js
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'ul', 'ol', '|', 'datagen', '|', 'source']
});
```

To keep the plugin loaded but turn it off in one editor, use `disablePlugins: ['datagen']`.
