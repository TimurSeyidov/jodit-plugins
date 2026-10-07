# Changelog

All notable changes to `jodit-plugin-shortlink` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-07

### Added

- "Shorten" button next to the URL field of the link form: it replaces the URL with the short link, and the link text too when it is the URL. Works with the built-in form and with a custom `link.formTemplate` that marks the field with `ref="url_input"`.
- "Shorten link" button in the toolbar of a link, after "Edit link": changes the link in place. Not shown for short links, email links and other links that are not http(s).
- Services: da.gd (default), clck.ru, cleanuri.com through a proxy on the site, or a function for your own service.
- Choice of the service right where links are shortened: a list next to the "Shorten" button and an arrow on the "Shorten link" button; da.gd and clck.ru by default, set with the `services` option, remembered in the browser unless `remember` is false.
- Error messages in the editor: the text of the service's error, an unreachable service, a timeout, a link that is not http(s), an answer that is not a link.
- `shorten`, `isHttpUrl` and `isShortUrl` to make short links outside the editor.
- English, German and Russian.
- ES module for bundlers, and browser builds for ES2015, ES2018 and ES2021, for a `<script>` tag or `extraPlugins`.

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/shortlink-v1.0.0...HEAD
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/shortlink-v1.0.0
