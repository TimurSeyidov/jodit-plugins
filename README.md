# Jodit Plugins

[![CI](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/ci.yml)
[![Docs](https://github.com/TimurSeyidov/jodit-plugins/actions/workflows/pages.yml/badge.svg)](https://timurseyidov.github.io/jodit-plugins/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Plugins for the [Jodit](https://xdsoft.net/jodit/) editor. Each plugin is a separate npm package; the documentation with live demos **[live demos](https://timurseyidov.github.io/jodit-plugins/)**.

| Plugin | Package | Version | Docs |
| --- | --- | --- | --- |
| Email link | [`jodit-plugin-mailto`](packages/mailto) | [![npm](https://img.shields.io/npm/v/jodit-plugin-mailto)](https://www.npmjs.com/package/jodit-plugin-mailto) | [See docs](https://timurseyidov.github.io/jodit-plugins/plugins/mailto/) |
| QR code | [`jodit-plugin-qrcode`](packages/qrcode) | [![npm](https://img.shields.io/npm/v/jodit-plugin-qrcode)](https://www.npmjs.com/package/jodit-plugin-qrcode) | [See docs](https://timurseyidov.github.io/jodit-plugins/plugins/qrcode/) |

## Development

Requirements: Node.js 22, Python 3.10+ for the documentation.

```shell
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements-docs.txt
source .venv/bin/activate

npm run build        # build every package into packages/*/dist
npm run typecheck    # type-check the sources
npm run docs         # build packages and the site into site/
npm run docs:serve   # build packages and serve the site on http://127.0.0.1:8095

npm test             # unit and browser tests
npm run test:unit    # unit tests (Vitest)
npm run test:e2e     # build packages and run the browser tests (Playwright)
```

The browser tests need Chromium: `npx playwright install chromium` once, or run them in the installed Google Chrome with `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

`npm run build -- qrcode` builds one package. `mkdocs serve` reloads the site when the docs change; after a change in `src/`, run `npm run build` again.

## Layout

```text
packages/<name>/
├── src/
│   ├── index.ts       ES module entry: registers the plugin in the Jodit class from the `jodit` package
│   ├── browser.ts     browser entry: registers the plugin in window.Jodit
│   └── ...
├── docs/              plugin documentation, published under plugins/<name>/
│   ├── index.md       overview, its first heading is the section title
│   └── ...
├── test/              unit tests of the package (Vitest)
├── package.json       name jodit-plugin-<name>, `docs.order` sets the page order
├── tsconfig.json
├── README.md          npm page
└── LICENSE
docs/                  site pages shared by all plugins
tests/e2e/             browser tests of all plugins (Playwright), with page.html loading any build
tools/build.mjs        builds every package with esbuild and tsc
tools/mkdocs_hooks.py  adds packages/*/docs and the built plugins to the site
tools/serve.mjs        static server for the browser tests
```

Every package builds into:

- `dist/index.mjs` and `dist/types/`: ES module and declarations for bundlers; `jodit` and runtime dependencies stay external;
- `dist/<target>/plugins/<name>/<name>.js` and `.min.js` for `es2015`, `es2018` and `es2021`: a standalone script with its dependencies included, for a `<script>` tag or the Jodit `extraPlugins` option. The folders match the builds of the `jodit` package (`jodit/es2021/...`).

## Adding a plugin

1. Copy `packages/qrcode` to `packages/<name>` and rename the package to `jodit-plugin-<name>`.
2. Write the plugin in `src/` and its pages in `docs/`.
3. Mark code blocks that should run as a live demo with `{ .js .jodit-demo }`:

    ````markdown
    ``` { .js .jodit-demo }
    Jodit.make('#editor', { buttons: ['bold', '<name>'] });
    ```
    ````

    The code runs on the page and the editor appears under it; `Jodit.make` creates the editor there whatever selector is passed.

4. Add unit tests to `test/` and browser tests to `tests/e2e/<name>.spec.ts`; load the plugin on the test page by adding it to the default `plugins` list in `tests/e2e/page.html` and `tests/e2e/helpers.ts`.
5. Add the plugin to the tables in `README.md` and `docs/index.md`.

The build, the navigation and the demo scripts pick the new package up automatically.

## Releases

Each package is released on its own. Bump the version in `packages/<name>/package.json`, commit, then tag and push:

```shell
git tag <name>-v<version>      # for example qrcode-v0.2.0
git push origin <name>-v<version>
```

The `Publish` workflow builds the package and publishes it to npm with provenance (npm trusted publishing). The first version of a new package is published by hand with `npm publish -w packages/<name>`, then the trusted publisher (this repository, `publish.yml`) is added in the package settings on npmjs.com.

## License

[MIT](LICENSE)
