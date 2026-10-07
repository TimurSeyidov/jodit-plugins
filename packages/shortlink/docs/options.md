# Options

Settings go into the `shortlink` option of the editor. Every key is optional; the values below are the defaults.

```js
Jodit.make('#editor', {
	shortlink: {
		service: 'dagd',
		services: { dagd: true, clck: true, cleanuri: false },
		remember: true,
		proxy: '',
		timeout: 10000,
		replaceText: true
	}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `service` | `'dagd'`, `'clck'`, `'cleanuri'` or a function | `'dagd'` | The service that makes the short links, see below; with a choice, the one chosen at first |
| `services` | object | da.gd and clck.ru | The services the user chooses from, see [Choice of the service](#choice-of-the-service) |
| `remember` | `boolean` | `true` | Remember the chosen service in the browser |
| `proxy` | `string` | `''` | Address on your site that forwards the requests of `'cleanuri'` |
| `timeout` | `number` | `10000` | Time to wait for the service, in milliseconds |
| `replaceText` | `boolean` | `true` | When the text of a link is its URL, put the short link into the text too |

## Services

| `service` | Short links | Request from the browser | Notes |
| --- | --- | --- | --- |
| `'dagd'` | `https://da.gd/…` | `GET https://da.gd/s?url=…` | Works from any site |
| `'clck'` | `https://clck.ru/…` | `GET https://clck.ru/--?url=…` | Works from any site; the service of Yandex |
| `'cleanuri'` | `https://cleanuri.com/…` | `POST` to `proxy` | Needs a proxy, see below |

A browser can read the answer of a service only when the service allows it with CORS headers. da.gd and clck.ru do; cleanuri.com does not, so its requests go to an address on your site that forwards them.

## Choice of the service

The user chooses the service in the link form, in the list between the URL field and the "Shorten" button, and in the link toolbar, with the arrow of the "Shorten link" button. The button uses the chosen service; choosing a service in the toolbar shortens the link with it at once. The choice is remembered in the browser (`localStorage`, through the storage of Jodit) for the next forms and editors; `remember: false` keeps it for the open editor only.

`services` lists the services in the order they are offered. `true` offers a built-in service, `false` hides it, and `{ title, service }` under any key adds your own:

```js
Jodit.make('#editor', {
	shortlink: {
		service: 'clck',
		services: {
			dagd: true,
			clck: true,
			cleanuri: true,
			ours: { title: 'go.example.com', service: url => ourShortener(url) }
		},
		proxy: '/api/shorten'
	}
});
```

It is an object rather than a list, so that one key can be changed without repeating the others: `services: { clck: false }` keeps da.gd only.

There is no choice when fewer than two services are offered, or when `service` is not one of them: then `service` is the only service. So `service: 'cleanuri'` or `service: myFunction` alone keeps working without a list; to offer your function next to the others, put the same function in `services` too.

### A proxy for cleanuri.com

The plugin posts `url=<long URL>` as a form to `proxy` and expects the answer of cleanuri.com: `{"result_url": "…"}` or `{"error": "…"}`. The proxy forwards the request as it is, for example in Node.js with Express:

```js
app.post('/api/shorten', express.urlencoded({ extended: false }), async (request, response) => {
	const answer = await fetch('https://cleanuri.com/api/v1/shorten', {
		method: 'POST',
		body: new URLSearchParams({ url: String(request.body.url ?? '') })
	});
	response.status(answer.status).type('json').send(await answer.text());
});
```

```js
Jodit.make('#editor', {
	shortlink: { service: 'cleanuri', proxy: '/api/shorten' }
});
```

### Your own service

`service` can be a function that takes the long URL and an `AbortSignal` and returns the short link. The signal aborts the request after `timeout`. To show your own message, throw a `ShortlinkError`; any other error is shown as "The link shortening service is not available".

```js
import { ShortlinkError } from 'jodit-plugin-shortlink';

Jodit.make('#editor', {
	shortlink: {
		service: async (url, signal) => {
			const response = await fetch('/api/short-links', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
				signal
			});

			if (!response.ok) {
				throw new ShortlinkError('Short links are turned off for this site');
			}

			return (await response.json()).short;
		}
	}
});
```

With the browser build, `ShortlinkError` is not available as an import; a function can throw `Object.assign(new Error('…'), { name: 'ShortlinkError' })` instead.

## Errors

When a link cannot be shortened, the editor shows an error message for five seconds and the link stays as it was:

| Message | When |
| --- | --- |
| The text of the service, such as `Long URL must have http:// or https:// scheme.` | The service refused the link |
| Only http:// and https:// links can be shortened | The URL is empty, relative or not http(s); the service is not asked |
| The link shortening service is not available | No connection, the service is down, or the browser blocked its answer (no CORS headers) |
| The link shortening service did not answer in time | No answer within `timeout` |
| The link shortening service gave an unexpected answer | The answer is not a link |

A link that is already short (da.gd, clck.ru or cleanuri.com) is not sent again; the editor says "The link is already short".

## Shortening outside the editor

The function the plugin uses is exported, with the same options:

```js
import { shorten } from 'jodit-plugin-shortlink';

const short = await shorten('https://example.com/a/long/path', {
	service: 'dagd',
	proxy: '',
	timeout: 10000
});
```

`isHttpUrl(url)` tells whether a link can be shortened, and `isShortUrl(url)` whether it is a short link of one of the services.

## Translations

The buttons and messages follow the editor `language` option. English, German (`de`) and Russian (`ru`) are included. Other languages can be added to `Jodit.lang`; the strings are:

```js
Jodit.lang.fr = {
	...Jodit.lang.fr,
	Shorten: 'Raccourcir',
	'Shorten link': 'Raccourcir le lien',
	'Make a short link with the shortening service': 'Obtenir un lien court du service',
	'Link shortening service': 'Service de raccourcissement',
	'Link shortened': 'Lien raccourci',
	'The link is already short': 'Le lien est déjà court',
	'Only http:// and https:// links can be shortened': 'Seuls les liens http:// et https:// peuvent être raccourcis',
	'The link shortening service is not available': "Le service de raccourcissement n'est pas disponible",
	'The link shortening service did not answer in time': "Le service de raccourcissement n'a pas répondu à temps",
	'The link shortening service gave an unexpected answer': 'Le service de raccourcissement a donné une réponse inattendue'
};
```

The error texts of the services themselves come in the language of the service.
