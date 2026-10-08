# Options

Settings go into the `datagen` option of the editor. Every key is optional; the values below are the defaults.

```js
Jodit.make('#editor', {
	datagen: {
		baseUrl: 'https://dummyjson.com',
		types: {},
		layouts: {},
		maxCount: 100,
		defaultCount: 5,
		remember: true,
		timeout: 10000
	}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `'https://dummyjson.com'` | Address of the data service, see [Your own data service](#your-own-data-service) |
| `types` | object | all types | Types offered in the dialog: `false` hides a type, see [Types](#types) |
| `layouts` | object | none | Layouts of your site, offered after the built-in ones, see [Layouts of your site](#layouts-of-your-site) |
| `maxCount` | `number` | `100` | Most items generated at once |
| `defaultCount` | `number` | `5` | Number of items offered the first time |
| `remember` | `boolean` | `true` | Remember the choice in the browser, see [What is remembered](#what-is-remembered) |
| `timeout` | `number` | `10000` | Time to wait for the data service, in milliseconds |

The number of items is also limited by the size of the collection: there are 50 recipes, so no more than 50 recipes can be inserted at once. The dialog shows the limit next to the number.

## Types

The dialog offers ten types, in this order: `posts`, `quotes`, `comments`, `todos`, `users`, `products`, `reviews`, `recipes`, `order` and `images`. Their fields are listed in [Types of data](types.md).

`types` hides the ones you do not need:

```js
Jodit.make('#editor', {
	datagen: { types: { users: false, order: false } }
});
```

It is an object rather than a list, so that one type can be hidden without repeating the others. Hiding all of them offers all of them again.

## Layouts of your site

`layouts` adds templates to the list of layouts of a type, under any key. Each one has the `type` it shows, the `title` in the list, and the three parts of a [template](templates.md):

```js
Jodit.make('#editor', {
	datagen: {
		layouts: {
			team: {
				type: 'users',
				title: 'Team cards',
				before: '<div class="team">',
				item:
					'<figure><img src="{{image}}" alt="{{fullName}}" width="96" height="96">' +
					'<figcaption>{{fullName}}<br><small>{{company.title}}</small></figcaption></figure>',
				after: '</div>'
			},
			priceList: {
				type: 'products',
				title: 'Price list',
				before: '<dl>',
				item: '<dt>{{title}}</dt><dd>${{finalPrice|fixed:2}}</dd>',
				after: '</dl>'
			}
		}
	}
});
```

The layouts of the site come after the built-in ones of their type, and before "Own template". Check them in the dialog: a layout with a problem shows it like a template written in the dialog. The class names of your layouts stay in the content; the styles are up to your site.

## Your own data service

[DummyJSON](https://github.com/Ovi/DummyJSON) is open source. To load the data from your own servers, or when dummyjson.com is not reachable from your network, run a copy of it and point `baseUrl` to it:

```js
Jodit.make('#editor', {
	datagen: { baseUrl: 'https://dummyjson.example.com' }
});
```

The plugin asks `<baseUrl>/<collection>?limit=0&select=<fields>` (for example `/posts?limit=0&select=title,body,tags,reactions,views`) and expects `{ "<collection>": [ … ] }` in the answer, with CORS headers when the service is on another domain. The placeholder images are `<baseUrl>/image/<width>x<height>/<background>/<color>?text=…`. Any service that answers these requests in the same way works.

## What is remembered

After an insertion the dialog remembers, for the next time:

- the type and the number of items;
- the layout chosen for each type;
- your own template of each type;
- the settings of the images.

The choice is kept in the browser (`localStorage`, through the storage of Jodit) and shared by the editors of the site. `remember: false` keeps it for the open page only. Nothing is remembered when the dialog is closed with "Cancel".

## Translations

The dialog, the names of the types, layouts and fields, the help and the messages are in English, German and Russian; the editor's `language` option chooses. The generated content is in English: that is the language of the data.

To translate the plugin into another language, add its texts to `Jodit.lang`, the same way as for Jodit itself. The keys are the English texts; the [Russian translation](https://github.com/TimurSeyidov/jodit-plugins/blob/main/packages/datagen/src/langs/ru.ts) has the full list.
