# Changelog

All notable changes to `jodit-plugin-qrcode` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.2] - 2026-10-06

### Added

- An animated demo in the README.

## [1.0.1] - 2026-10-06

### Fixed

- The `qrcode` option of `Jodit.make()` is typed in projects with `moduleResolution: "nodenext"`: relative imports in the declarations now carry the `.js` extension.
- The `errorCorrectionLevel` option is typed as `'L' | 'M' | 'Q' | 'H'` without `@types/qrcode`, which projects using the plugin do not have; it was `any` before.

## [1.0.0] - 2026-10-06

### Added

- Toolbar button that inserts a QR code for a text or link as an image, with a live preview in the dialog.
- The dialog opens with the selected text; the text stays and the code is inserted after it.
- Editing of an inserted code: double click, the pencil of the image toolbar, or the button; the size set by resizing is kept.
- The image tools of Jodit treat QR codes as QR codes: the image properties dialog is not opened for them, and the image button is not highlighted on them.
- Options: `size`, `margin`, `errorCorrectionLevel`, `dark`, `light`, `format` (PNG or SVG), `useSelection`, `className`.
- English, German and Russian.
- ES module for bundlers, and browser builds for ES2015, ES2018 and ES2021 with the qrcode library included, for a `<script>` tag or `extraPlugins`.

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/qrcode-v1.0.2...HEAD
[1.0.2]: https://github.com/TimurSeyidov/jodit-plugins/compare/qrcode-v1.0.1...qrcode-v1.0.2
[1.0.1]: https://github.com/TimurSeyidov/jodit-plugins/compare/qrcode-v1.0.0...qrcode-v1.0.1
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/qrcode-v1.0.0
