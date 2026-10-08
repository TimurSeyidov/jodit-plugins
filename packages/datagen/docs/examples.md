# Examples

Each example shows the configuration code and the editor it creates. Press the button with the dice, choose the data and press "Insert"; the source view button shows the HTML. The examples ask dummyjson.com for the data.

## Default settings

All types, up to 100 items, five the first time.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'ul', 'ol', 'table', '|', 'datagen', '|', 'source'],
	height: 360
});
```

## A few types, a few items

Only the texts, no more than 10 items, three the first time.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['datagen', '|', 'source'],
	height: 300,
	datagen: {
		types: { users: false, products: false, reviews: false, recipes: false, order: false, images: false },
		maxCount: 10,
		defaultCount: 3,
		remember: false
	}
});
```

## Layouts of the site

Two layouts of the site: "Team cards" for users and "Price list" for products. They come after the built-in layouts of their type.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['datagen', '|', 'source'],
	height: 360,
	datagen: {
		remember: false,
		layouts: {
			team: {
				type: 'users',
				title: 'Team cards',
				before: '',
				item:
					'<p><img src="{{image}}" alt="{{fullName}}" width="64" height="64" style="float: left; margin-right: 12px">' +
					'<strong>{{fullName}}</strong><br>{{company.title}}<br><a href="mailto:{{email}}">{{email}}</a></p>' +
					'<p style="clear: both"></p>',
				after: ''
			},
			priceList: {
				type: 'products',
				title: 'Price list',
				before: '<table><tbody>',
				item: '<tr><td>{{title}}</td><td>{{brand|default:—}}</td><td style="text-align: right">${{finalPrice|fixed:2}}</td></tr>',
				after: '</tbody></table><p>{{count}} products</p>'
			}
		}
	}
});
```

## Into existing text

The caret is at the end of the first paragraph. A template of text, like `, {{firstName}}` for users with empty Before and After, goes right there; blocks go after the paragraph.

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['datagen', '|', 'source'],
	height: 300,
	datagen: { remember: false }
});

editor.value = '<p>Our team: Anna</p><p>The rest of the page.</p>';
editor.s.setCursorIn(editor.editor.firstChild, false);
```

## Russian interface

The dialog follows the language of the editor. The data stays in English.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	language: 'ru',
	buttons: ['datagen', '|', 'source'],
	height: 300
});
```
