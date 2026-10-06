# Options

Settings go into the `qrcode` option of the editor. Every key is optional; the values below are the defaults.

```js
Jodit.make('#editor', {
	qrcode: {
		size: 200,
		margin: 1,
		errorCorrectionLevel: 'M',
		dark: '#000000',
		light: '#ffffff',
		format: 'png',
		useSelection: true,
		className: ''
	}
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `200` | Width and height of the inserted image, in pixels. Also written to the `width` and `height` attributes. |
| `margin` | `number` | `1` | Width of the empty border around the code, in modules (code cells). Scanners read codes more reliably with a margin of at least 1 on a busy background. |
| `errorCorrectionLevel` | `'L'` \| `'M'` \| `'Q'` \| `'H'` | `'M'` | How much of the code can be damaged and still be read: 7%, 15%, 25% or 30%. Higher levels make the code denser and fit less text. |
| `dark` | `string` | `'#000000'` | Color of the dark modules, `#RRGGBB` or `#RRGGBBAA`. |
| `light` | `string` | `'#ffffff'` | Color of the light modules and the background. `#ffffff00` gives a transparent background. |
| `format` | `'png'` \| `'svg'` | `'png'` | Image format of the inserted `data:` URL. SVG stays sharp at any size and is usually smaller. |
| `useSelection` | `boolean` | `true` | Open the dialog with the selected text in the input. |
| `className` | `string` | `''` | CSS classes added to the inserted image, separated by spaces. |

Defaults for every editor on the page can be changed once, after the plugin is loaded:

```js
Jodit.defaultOptions.qrcode.format = 'svg';
```

## Inserted markup

The plugin inserts an image like this:

```html
<img src="data:image/png;base64,…" alt="https://xdsoft.net/jodit/"
     data-qrcode="https://xdsoft.net/jodit/" width="200" height="200">
```

The encoded text is kept in `data-qrcode`; the plugin uses it to edit the code later. If your server cleans the HTML, allow the `data-qrcode` attribute and `data:` URLs in `img[src]`, or the codes will lose their image or become uneditable.

## Working with the image tools

A QR code is an `<img>`, so the image tools of Jodit work on it: resizing, alignment, deletion. Where they would edit it as a plain picture, the plugin hands over to the QR code dialog:

- **Double click** on a QR code opens the QR code dialog instead of the image properties dialog.
- The **pencil** in the small image toolbar that appears on click opens the QR code dialog too.
- On a QR code the QR code button is highlighted in the main toolbar, and the image button is not.

Updating a code keeps the size it was given by resizing. Regular images are not affected. With `disablePlugins: ['qrcode']` QR codes are treated as regular images again.

## Limits

A QR code holds up to about 2,900 characters of Latin text at level `L`, and fewer at higher levels or with non-Latin text. When the text does not fit, the dialog shows an error instead of the preview and nothing is inserted.

## Translations

The dialog follows the editor `language` option. English, German (`de`) and Russian (`ru`) are included. Other languages can be added to `Jodit.lang`:

```js
Jodit.lang.fr = {
	...Jodit.lang.fr,
	'Insert QR code': 'Insérer un code QR',
	'Text or URL': 'Texte ou URL',
	Insert: 'Insérer',
	Update: 'Mettre à jour',
	'Could not create a QR code: the text is too long': 'Impossible de créer le code QR : le texte est trop long'
};
```
