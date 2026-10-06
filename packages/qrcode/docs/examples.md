# Examples

Each example shows the configuration code and the editor it creates. Press the QR code button in an editor, type a text or link and press "Insert".

## Default settings

``` { .js .jodit-demo }
Jodit.make('#editor');
```

## Compact toolbar

``` { .js .jodit-demo }
Jodit.make('#editor', {
	toolbarAdaptive: false,
	buttons: ['bold', 'italic', 'underline', '|', 'link', 'qrcode']
});
```

## SVG with brand colors

A sharp vector image, dark blue on a transparent background, with the highest error correction level.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'qrcode', '|', 'source'],
	qrcode: {
		format: 'svg',
		size: 160,
		dark: '#1a237e',
		light: '#ffffff00',
		errorCorrectionLevel: 'H'
	}
});
```

## Editing an inserted code

Insert a code, click it, press the QR code button again, change the text and press "Update". The image is replaced in place; the source view shows the new text in `data-qrcode`.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['qrcode', '|', 'source']
});
```

## Russian interface

``` { .js .jodit-demo }
Jodit.make('#editor', {
	language: 'ru',
	buttons: ['bold', 'italic', '|', 'qrcode']
});
```
