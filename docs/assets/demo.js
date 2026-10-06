// Live demos: every code block marked `{ .js .jodit-demo }` is run, and its
// result is shown under the code. `Jodit.make(selector, options)` in the demo
// code creates the editor in the result area instead of `selector`, so the
// code shown on the page is the same code a reader copies.

(function () {
	const editors = [];

	function isDark() {
		return document.body.getAttribute('data-md-color-scheme') === 'slate';
	}

	function scopedJodit(target) {
		const scoped = Object.create(Jodit);
		scoped.make = function (_selector, options) {
			const editor = Jodit.make(
				target,
				Object.assign(
					// Show every button: on a narrow page Jodit would move
					// the plugin button into the "⋮" menu
					{ theme: isDark() ? 'dark' : 'default', toolbarAdaptive: false },
					options
				)
			);
			editors.push(editor);
			return editor;
		};
		return scoped;
	}

	function run(block) {
		const code = block.querySelector('code');
		if (!code) {
			return;
		}

		let result = block.nextElementSibling;
		if (!result || !result.classList.contains('jodit-demo-result')) {
			result = document.createElement('div');
			result.className = 'jodit-demo-result';
			block.after(result);
		}

		const target = document.createElement('textarea');
		result.replaceChildren(target);

		try {
			new Function('Jodit', code.textContent)(scopedJodit(target));
		} catch (error) {
			result.textContent = String(error);
			console.error(error);
		}
	}

	function init() {
		while (editors.length) {
			editors.pop().destruct();
		}

		document.querySelectorAll('.jodit-demo').forEach(run);
	}

	// Material for MkDocs re-renders the page content without a full reload
	// when instant navigation is on; `document$` is its page-ready stream
	if (window.document$) {
		window.document$.subscribe(init);
	} else {
		document.addEventListener('DOMContentLoaded', init);
	}

	new MutationObserver(init).observe(document.body, {
		attributes: true,
		attributeFilter: ['data-md-color-scheme']
	});
})();
