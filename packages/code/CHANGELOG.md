# Changelog

All notable changes to `jodit-plugin-code` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-07

### Added

- Toolbar button and dialog that insert code blocks with syntax highlighting by highlight.js: 36 common languages included, automatic detection, more with `registerLanguage`.
- Preview tab in the dialog, line numbers as an option and per block, Tab and Shift+Tab indentation in the code field.
- "Download as a file" per block, with an optional file name (`Untitled.<ext>` by default), saved as `data-download`.
- Copy and download buttons in the header of a block, in the editor (not saved with the HTML) and on the site.
- Blocks with a header and inline styles written as CSS variables with defaults, so they need no CSS on the site and can be recolored with variables; every part has a `jodit-code__*` class.
- Editing in the editor: double click, or a toolbar on click with edit, copy and delete; Delete and Backspace remove a selected block; a plain `<pre>` becomes a block when edited.
- Runtime for the pages that show the content (`jodit-plugin-code/runtime`, or a `<script>`) that adds the copy and download buttons to the blocks.
- `renderBlock` to make the HTML of a block outside the editor.
- Options: `languages`, `defaultLanguage`, `lineNumbers`, `download`, `indent`, `tabSize`, `className`.
- English, German and Russian.
- ES module for bundlers, and browser builds for ES2015, ES2018 and ES2021 with highlight.js included, for a `<script>` tag or `extraPlugins`.

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/code-v1.0.0...HEAD
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/code-v1.0.0
