# Options

Settings go into the `mailto` option of the editor. Every key is optional; the values below are the defaults.

```js
Jodit.make('#editor', {
	mailto: {
		fields: {
			subject: 'main',
			cc: 'additional',
			bcc: 'additional',
			body: 'additional'
		},
		required: {
			to: true,
			cc: false,
			bcc: false,
			subject: false,
			body: false,
			text: false
		},
		multiple: true,
		validate: true,
		useSelection: true,
		className: ''
	}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fields` | `object` | see above | Where each optional field is shown: `'main'` (on both tabs), `'additional'` (only on the "Additional" tab) or `false` (hidden). Keys: `subject`, `cc`, `bcc`, `body`. To and the link text are always on both tabs. |
| `required` | `object` | `{ to: true }` | Fields that must be filled in: `to`, `cc`, `bcc`, `subject`, `body`, `text`. Their labels get a `*`. A required field that is hidden is shown on the main tab. |
| `multiple` | `boolean` | `true` | Allow several addresses in To, Cc and Bcc. With `false`, each of them accepts one address. |
| `validate` | `boolean` | `true` | Check that every address looks like `name@domain.tld`. Turn it off to allow local addresses such as `admin@localhost`. |
| `useSelection` | `boolean` | `true` | Use the selected text as the link text, and put it into To when it is an email address. |
| `className` | `string` | `''` | CSS classes added to inserted links, separated by spaces. |

`fields` and `required` are objects, so you only list what you change; the other keys keep their defaults:

```js
Jodit.make('#editor', {
	mailto: {
		fields: { bcc: false, body: 'main' }, // hide Bcc, move Body to the main tab
		required: { subject: true }           // To and Subject are required
	}
});
```

Defaults for every editor on the page can be changed once, after the plugin is loaded:

```js
Jodit.defaultOptions.mailto.required.subject = true;
```

## Tabs

The dialog has two tabs:

- **Main**: the short form. To, the fields set to `'main'` (Subject by default) and the link text.
- **Additional**: the full form with every shown field, in the order To, Cc, Bcc, Subject, Body, link text.

A field that is on both tabs is the same field: what you type on one tab is shown on the other, and an error is shown on both. The title of the "Additional" tab shows how many of the fields that are only on it are filled in, for example "Additional (2)", and a `*` when one of them is required.

When the field with an error is not on the open tab, pressing "Insert" switches to the tab that has it. If no field is set to `'additional'`, the dialog has no tabs and shows the main form only.

## Fields

| Field | In the link | Notes |
| --- | --- | --- |
| To | `mailto:<addresses>` | Recipients. Can be made optional with `required: { to: false }`: `mailto:?subject=…` is a valid link, and the mail app asks for the recipient. |
| Cc | `cc=` | Copy recipients. |
| Bcc | `bcc=` | Hidden copy recipients. |
| Subject | `subject=` | Subject line. |
| Body | `body=` | Message text. Line breaks are kept. |
| Link text | the text of `<a>` | When empty, the link shows the To addresses, or the subject if there are no addresses. |

Addresses can be separated by commas, semicolons, spaces or line breaks; the link always uses commas.

## Inserted markup

```html
<a href="mailto:sales@example.com,support@example.com?cc=boss@example.com&amp;subject=Order%20%2312&amp;body=Hello%2C%0D%0A">Write to us</a>
```

Values are percent-encoded as [RFC 6068](https://www.rfc-editor.org/rfc/rfc6068) requires: spaces become `%20`, line breaks in the body become `%0D%0A`, and `+` stays a plus sign. Header fields the dialog does not show, such as `in-reply-to`, are kept when an existing link is edited.

## Editing and removing links

Put the cursor inside an email link, or select it, and press the button. The dialog opens with the fields of that link and two buttons: "Update" saves the changes, "Unlink" removes the link and keeps its text. If the link text is not changed in the dialog, its formatting (bold, italic and so on) is kept.

Clicking an email link also opens the small link toolbar of Jodit. For email links its pencil button opens this dialog instead of the generic link dialog; the other buttons (open, unlink and so on) stay as they are.

Inside an email link the email button is highlighted in the main toolbar, and the regular link button is not. With `disablePlugins: ['mailto']` the editor handles email links like any other link again.

## Translations

The dialog follows the editor `language` option. English, German (`de`) and Russian (`ru`) are included. Other languages can be added to `Jodit.lang`:

```js
Jodit.lang.fr = {
	...Jodit.lang.fr,
	'Insert email link': 'Insérer un lien e-mail',
	To: 'À',
	Cc: 'Cc',
	Bcc: 'Cci',
	Subject: 'Objet',
	Body: 'Message',
	'Link text': 'Texte du lien',
	Insert: 'Insérer',
	Update: 'Mettre à jour',
	Unlink: 'Supprimer le lien',
	'Invalid email address: %s': 'Adresse e-mail invalide : %s',
	'Only one address is allowed': 'Une seule adresse est autorisée'
};
```
