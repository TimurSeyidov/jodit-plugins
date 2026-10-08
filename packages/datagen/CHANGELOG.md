# Changelog

All notable changes to `jodit-plugin-datagen` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-08

### Added

- "Generate data" toolbar button and dialog with the tabs "Data", "Template" and "Help", a preview of the result and "Insert".
- Ten types of data from DummyJSON: posts, quotes, comments, to-dos, users, products, reviews, recipes, an order of products with quantities and totals, and placeholder images. Up to 100 items at once, chosen at random without repeats, with "Shuffle"; a short description of each type in the dialog.
- Built-in layouts for every type: headings and paragraphs, lists, checklists, tables, cards, full recipes and more.
- Templates in three parts, Before, Item and After, with placeholders (`{{title}}`, `{{company.name}}`, `{{images.0}}`, `{{reviews.comment}}`, `{{index}}`, `{{count}}`) and the filters `ul`, `ol`, `first`, `join`, `count`, `words`, `fixed` and `default`. Syntax highlighting in the template, a clickable list of the fields of the type, and a short reference on the "Help" tab.
- Checks of the template while typing: unknown fields and filters, wrong arguments and unclosed placeholders are underlined and listed, and stop the insertion; tags that are not closed are a warning.
- Values are escaped, the preview runs no scripts, and the inserted HTML goes through the `cleanHTML` settings of the editor. The private fields of DummyJSON users are never asked for.
- Insertion of blocks in place of the empty paragraph of the caret or after its block, and of text and inline elements at the caret. The inserted content has no marks of the plugin.
- Options `baseUrl` (your own copy of DummyJSON), `types`, `layouts` (layouts of your site), `maxCount`, `defaultCount`, `remember` and `timeout`.
- `generate`, `checkTemplate`, `render`, `TYPES`, `LAYOUTS` and `FILTERS` to make content outside the editor.
- English, German and Russian.
- ES module for bundlers, and browser builds for ES2015, ES2018 and ES2021, for a `<script>` tag or `extraPlugins`.

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/datagen-v1.0.0...HEAD
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/datagen-v1.0.0
