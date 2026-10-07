# Changelog

All notable changes to `jodit-plugin-shortlink` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-10-07

### Removed

- The cleanuri.com service (`service: 'cleanuri'`, `services: { cleanuri: … }`) and the `proxy` option it needed: browsers cannot call cleanuri.com directly, and a proxy on the site is rarely set up. A service like it can still be used through your own server with a function as `service`.

This removal breaks the 1.0.0 options that used cleanuri, which semantic versioning would release as 2.0.0. It comes as 1.1.0 because 1.0.0 was out for less than an hour and cleanuri did not work in it without a proxy. If you set `service: 'cleanuri'`, switch to `'dagd'`, `'clck'` or a function.

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

[Unreleased]: https://github.com/TimurSeyidov/jodit-plugins/compare/shortlink-v1.1.0...HEAD
[1.1.0]: https://github.com/TimurSeyidov/jodit-plugins/compare/shortlink-v1.0.0...shortlink-v1.1.0
[1.0.0]: https://github.com/TimurSeyidov/jodit-plugins/releases/tag/shortlink-v1.0.0
