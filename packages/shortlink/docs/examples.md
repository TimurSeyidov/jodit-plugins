# Examples

Each example shows the configuration code and the editor it creates. Select text, press the link button, paste a long URL and press "Shorten"; or click a link and press "Shorten link" in its toolbar. The source view button shows the result. The examples with da.gd and clck.ru make real requests to these services.

## Default settings

da.gd makes the short links. The text of the first link is its URL, so it becomes the short link too; the second link keeps its text.

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'link', '|', 'source']
});

editor.value =
	'<p><a href="https://github.com/TimurSeyidov/jodit-plugins/tree/main/packages/shortlink">https://github.com/TimurSeyidov/jodit-plugins/tree/main/packages/shortlink</a></p>' +
	'<p>The <a href="https://github.com/TimurSeyidov/jodit-plugins/blob/main/packages/shortlink/CHANGELOG.md">changelog</a> of the plugin.</p>';
```

## clck.ru only

No choice: the list and the arrow are gone.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['link', '|', 'source'],
	shortlink: { service: 'clck', services: { dagd: false } }
});
```

## Your service in the list

A function joins da.gd and clck.ru in the list, chosen at first. It makes up the short link without the network.

``` { .js .jodit-demo }
const demo = async url => 'https://go.example.com/' + url.length.toString(36);

Jodit.make('#editor', {
	buttons: ['link', '|', 'source'],
	shortlink: {
		service: demo,
		services: { demo: { title: 'go.example.com', service: demo } },
		remember: false
	}
});
```

## Your own service

A function makes the short links. This one does not use the network: it returns a made-up link after half a second, and refuses links to `example.org` with its own message.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['link', '|', 'source'],
	shortlink: {
		service: async url => {
			await new Promise(resolve => setTimeout(resolve, 500));

			if (new URL(url).hostname.endsWith('example.org')) {
				throw Object.assign(new Error('Links to example.org are not shortened'), {
					name: 'ShortlinkError'
				});
			}

			return 'https://go.example.com/' + Math.random().toString(36).slice(2, 8);
		}
	}
});
```

## Keep the text of links

The text of a link stays as it is, even when it is the URL.

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['link', '|', 'source'],
	shortlink: { replaceText: false }
});

editor.value =
	'<p><a href="https://timurseyidov.github.io/jodit-plugins/plugins/shortlink/examples/">https://timurseyidov.github.io/jodit-plugins/plugins/shortlink/examples/</a></p>';
```

## Russian interface

``` { .js .jodit-demo }
Jodit.make('#editor', {
	language: 'ru',
	buttons: ['link', '|', 'source']
});
```
