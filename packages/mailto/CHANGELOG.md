# Changelog

All notable changes to `jodit-plugin-mailto` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.2] - 2026-10-06

### Fixed

- The address preview and the "Insert" and "Unlink" buttons stay at the bottom of the dialog while the fields scroll. On the "Additional" tab the form is higher than the popup, and the buttons were out of view.

### Added

- An animated demo in the README.

## [1.0.1] - 2026-10-06

### Fixed

- The `mailto` option of `Jodit.make()` is typed in projects with `moduleResolution: "nodenext"`: relative imports in the declarations now carry the `.js` extension.

## [1.0.0] - 2026-10-06

### Added

- Toolbar button that inserts `mailto:` links with To, Cc, Bcc, Subject, Body and the link text, encoded as RFC 6068 requires.
- Two tabs: a short form with To, Subject and the link text, and "Additional" with every field; fields on both tabs share their values.
- Required fields marked with `*`, address checks, and a switch to the tab that has an error.
- Editing and removal of existing email links; other header fields of a link are kept.
- The link tools of Jodit treat email links as email links: the pencil of the link toolbar opens this dialog, and the link button is not highlighted in them.
- Options: `fields` and `required` as per-field objects, `multiple`, `validate`, `useSelection`, `className`.
- `buildMailto` and `parseMailto` exported for use outside the editor.
- English, German and Russian.
- ES module for bundlers, and browser builds for ES2015, ES2018 and ES2021 for a `<script>` tag or `extraPlugins`.

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/mailto-v1.0.2...HEAD
[1.0.2]: https://github.com/TimurSeyidov/jodit-plugins/compare/mailto-v1.0.1...mailto-v1.0.2
[1.0.1]: https://github.com/TimurSeyidov/jodit-plugins/compare/mailto-v1.0.0...mailto-v1.0.1
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/mailto-v1.0.0
