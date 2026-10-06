"""MkDocs hooks that publish the documentation of every package.

For each ``packages/<dir>/`` with a ``docs/`` folder:

* ``docs/**`` is served under ``plugins/<name>/`` and listed in the
  navigation under "Plugins", with ``index.md`` first and the pages from
  ``docs.order`` in its ``package.json`` next;
* the "Edit" button of these pages points to ``packages/<dir>/docs/``;
* the ES2021 browser bundle ``dist/es2021/plugins/<name>/<name>.min.js`` is served under
  ``assets/plugins/`` and loaded on every page, after Jodit itself.

Jodit is taken from ``node_modules/jodit/es2021``. Run ``npm run build``
before ``mkdocs build``.
"""

import json
import logging
from pathlib import Path

from mkdocs.structure.files import File

log = logging.getLogger("mkdocs.hooks.jodit_plugins")

ROOT = Path(__file__).resolve().parent.parent
PACKAGES = ROOT / "packages"
JODIT = ROOT / "node_modules" / "jodit" / "es2021"
JODIT_FILES = ["jodit.min.js", "jodit.min.css"]

# Site path of every generated plugin page -> its path in the repository
_sources: dict[str, str] = {}


def _packages():
    """Yields ``(name, package dir, package.json)`` for documented packages."""
    for pkg_dir in sorted(PACKAGES.iterdir()):
        manifest = pkg_dir / "package.json"
        if not manifest.is_file() or not (pkg_dir / "docs").is_dir():
            continue
        pkg = json.loads(manifest.read_text(encoding="utf-8"))
        yield pkg["name"].removeprefix("jodit-plugin-"), pkg_dir, pkg


def _title(page: Path) -> str:
    """Returns the first level-one heading of a Markdown page."""
    for line in page.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return page.stem


def on_config(config):
    plugins_nav = []

    for name, pkg_dir, pkg in _packages():
        docs = pkg_dir / "docs"
        order = ["index.md", *pkg.get("docs", {}).get("order", [])]
        pages = [p for p in order if (docs / p).is_file()]
        pages += sorted(
            p.relative_to(docs).as_posix()
            for p in docs.rglob("*.md")
            if p.relative_to(docs).as_posix() not in pages
        )
        plugins_nav.append(
            {_title(docs / "index.md"): [f"plugins/{name}/{p}" for p in pages]}
        )

    if plugins_nav:
        config["nav"].append({"Plugins": plugins_nav})

    scripts = ["assets/vendor/jodit/jodit.min.js"]
    scripts += [
        f"assets/plugins/{name}/{name}.min.js" for name, _, _ in _packages()
    ]
    config["extra_javascript"][:0] = scripts
    config["extra_css"][:0] = ["assets/vendor/jodit/jodit.min.css"]

    return config


def on_files(files, config):
    def add(uri: str, path: Path) -> None:
        if not path.is_file():
            log.warning("Missing %s, run `npm install` and `npm run build`", path)
            return
        files.append(File.generated(config, uri, abs_src_path=str(path)))

    for asset in JODIT_FILES:
        add(f"assets/vendor/jodit/{asset}", JODIT / asset)

    for name, pkg_dir, _ in _packages():
        docs = pkg_dir / "docs"
        for path in sorted(docs.rglob("*")):
            if path.is_file():
                uri = f"plugins/{name}/{path.relative_to(docs).as_posix()}"
                _sources[uri] = path.relative_to(ROOT).as_posix()
                add(uri, path)

        bundle = f"{name}.min.js"
        add(
            f"assets/plugins/{name}/{bundle}",
            pkg_dir / "dist" / "es2021" / "plugins" / name / bundle,
        )

    return files


def on_page_context(context, page, config, nav):
    source = _sources.get(page.file.src_uri)
    if source and config.get("repo_url"):
        page.edit_url = f"{config['repo_url'].rstrip('/')}/edit/main/{source}"
    return context
