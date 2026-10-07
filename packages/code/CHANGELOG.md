# Changelog

All notable changes to `jodit-plugin-code` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.3.0] - 2026-10-07

### Added

- "Site highlighting" switch for each block, in the dialog and in the toolbar of the block, and the `native` option for new blocks: the block keeps its frame, header and buttons, and its code is saved as plain `<code class="language-*">` without colors, for highlight.js, Prism or another highlighter of the site and its theme. In the editor it looks and works as any block; `data-native` keeps it this way when the HTML is edited again.
- "Header" switch for each block, in the dialog and in the toolbar of the block, and the `header` option for new blocks: without the header the block is the frame and the code, with no copy or download button; switching it off also stops offering the file.
- `renderNative` to make that HTML outside the editor.

### Changed

- `<code>` of a block with its own colors also has the `nohljsln` class, and so has a block with site highlighting and its own line numbers: highlightjs-line-numbers.js, which numbers `code.nohighlight` too, no longer adds a second column of numbers. Blocks saved before get it when saved again.

## [1.2.0] - 2026-10-07

### Added

- Works next to Jodit PRO: when the `pasteCode` button is in the toolbar, the plugin turns itself off in that editor with a warning in the console; without the button both plugins work, and Jodit PRO no longer repaints the blocks, opens its dialog or popup for them, or strips their highlighting from the saved HTML.

### Changed

- `<code>` of a block has the `nohighlight` class in place of `language-*`, so highlight.js and Prism on a site skip the blocks: no repainting and no highlight.js warnings. Blocks saved before get it when saved again.
- In the editor a block holds its code and line numbers in `<div>` elements instead of `<pre>`; the saved HTML is unchanged.

## [1.1.0] - 2026-10-07

### Added

- Language button in the toolbar of a block: choosing another language highlights the code again and keeps the other settings of the block.
- Line numbers switch in the toolbar of a block.

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

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/code-v1.3.0...HEAD
[1.3.0]: https://github.com/TimurSeyidov/jodit-plugins/compare/code-v1.2.0...code-v1.3.0
[1.2.0]: https://github.com/TimurSeyidov/jodit-plugins/compare/code-v1.1.0...code-v1.2.0
[1.1.0]: https://github.com/TimurSeyidov/jodit-plugins/compare/code-v1.0.0...code-v1.1.0
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/code-v1.0.0
