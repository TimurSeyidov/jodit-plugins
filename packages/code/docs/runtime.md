# Runtime

The saved HTML has no scripts: HTML cleaners remove them, and a block must work without them. The copy button of a block on the site, and the download button of a block offered as a file, come from a small runtime script (about 2 KB) that you add to the pages that show the content. Without it the blocks are shown as they are, without the buttons.

The block below is plain HTML saved by the editor, offered as a file named `example`; the runtime of this site added its buttons. Try them:

<div class="jodit-code" data-lang="javascript" data-download="example" style="margin:1em 0;border:1px solid var(--jodit-code-border,#d0d7de);border-radius:var(--jodit-code-radius,6px);overflow:hidden;background:var(--jodit-code-background,#f6f8fa);color:var(--jodit-code-color,#1f2328)"><div class="jodit-code__header" style="display:flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;background:var(--jodit-code-header-background,#eaeef2);border-bottom:1px solid var(--jodit-code-border,#d0d7de);color:var(--jodit-code-header-color,#57606a);font:600 12px/1.5 var(--jodit-code-header-font,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif)"><span class="jodit-code__lang" style="flex:1">JavaScript</span></div><div class="jodit-code__body" style="display:flex;overflow-x:auto"><pre class="jodit-code__pre" style="margin:0;padding:12px 16px;flex:1 0 auto;background:none;border:0;border-radius:0;color:inherit;white-space:pre;font:400 13px/1.5 var(--jodit-code-font,ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace);tab-size:4"><code class="jodit-code__code language-javascript" data-lang="javascript" style="display:block;padding:0;background:none;border:0;color:inherit;font:inherit;white-space:inherit"><span class="jodit-code__keyword" style="color:var(--jodit-code-keyword,#cf222e)">import</span> { <span class="jodit-code__title" style="color:var(--jodit-code-title,#8250df)">enhance</span> } <span class="jodit-code__keyword" style="color:var(--jodit-code-keyword,#cf222e)">from</span> <span class="jodit-code__string" style="color:var(--jodit-code-string,#0a3069)">'jodit-plugin-code/runtime'</span>;

<span class="jodit-code__title" style="color:var(--jodit-code-title,#8250df)">enhance</span>();</code></pre></div></div>

## With a script tag

```html
<script src="https://cdn.jsdelivr.net/npm/jodit-plugin-code@1/dist/es2021/plugins/code/code-runtime.min.js" defer></script>
```

The script adds the buttons when the page is parsed. For blocks added later (a single-page application, content loaded on demand), call it again:

```js
window.JoditCodeRuntime.enhance();
```

The runtime has builds for ES2015, ES2018 and ES2021, next to the plugin: `dist/<build>/plugins/code/code-runtime.min.js`.

## With a bundler

```js
import { enhance } from 'jodit-plugin-code/runtime';

enhance(); // the whole document
enhance(document.querySelector('#article')); // or a part of it
```

The runtime does not import Jodit or highlight.js, so it adds almost nothing to the bundle of the site.

## API

`enhance(root?, options?)` adds the buttons to every block inside `root` (the document by default) that has none yet, and returns how many blocks it changed. Calling it again is safe.

| Option | Default | Description |
| --- | --- | --- |
| `label` | `'Copy code'` | Label and tooltip of the button |
| `copiedLabel` | `'Copied'` | Label for a moment after the code is copied |
| `downloadLabel` | `'Download'` | Label and tooltip of the download button |

```js
enhance(document, {
	label: 'Копировать',
	copiedLabel: 'Скопировано',
	downloadLabel: 'Скачать'
});
```

The copy button copies the text of the code without the line numbers. It uses the Clipboard API, and a fallback for pages without it (plain `http`, old browsers). The download button saves the same text as a file named after `data-download` (see [Download as a file](options.md#download-as-a-file)). Blocks inside an editor are skipped: the editor has buttons of its own, which are not saved.

The buttons have the classes `jodit-code__copy` and `jodit-code__download`; their hover color is the `--jodit-code-copy-hover` variable.
