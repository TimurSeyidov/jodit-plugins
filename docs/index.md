# Jodit plugins

Plugins for the [Jodit](https://xdsoft.net/jodit/) WYSIWYG editor. Each plugin is a separate npm package that works with Jodit 4: install it, import it once, and its button appears in the toolbar.

## Plugins

| Plugin | Package | What it does |
| --- | --- | --- |
| [Email link](plugins/mailto/index.md) | `jodit-plugin-mailto` | Inserts `mailto:` links with To, Cc, Bcc, Subject and Body; required fields are configurable |
| [QR code](plugins/qrcode/index.md) | `jodit-plugin-qrcode` | Inserts QR codes for any text or link, with a live preview and editing of inserted codes |

## Ways to connect a plugin

Every plugin can be connected in three ways, described in [Getting started](getting-started.md):

- as an npm package imported next to Jodit, for applications built with Vite, webpack, Next.js and other bundlers;
- as a single `<script>` from a CDN after `jodit.min.js`, for pages without a build step;
- through the Jodit `extraPlugins` option, which downloads the plugin when the editor starts.
