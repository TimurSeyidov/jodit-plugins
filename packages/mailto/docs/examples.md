# Examples

Each example shows the configuration code and the editor it creates. Press the email button in an editor, fill in the fields and press "Insert"; the source view button shows the inserted link.

## Default settings

"Main" has To, Subject and the link text; "Additional" has every field. Fill in To on "Main", switch to "Additional": the value is there too. Only To is required.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['bold', 'italic', '|', 'mailto', '|', 'source']
});
```

## Required subject, no Bcc

To and Subject must be filled in, Bcc is hidden.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['mailto', '|', 'source'],
	mailto: {
		fields: { bcc: false },
		required: { subject: true }
	}
});
```

## Required field on the "Additional" tab

The message text is required. Press "Insert" with an empty Body: the dialog switches to the "Additional" tab and shows the error.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['mailto', '|', 'source'],
	mailto: {
		required: { body: true }
	}
});
```

## One tab, one address

No field is left for the "Additional" tab, so the dialog has no tabs: Cc and Bcc are hidden, Body is moved to the main form, and To accepts one address.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['mailto', '|', 'source'],
	mailto: {
		fields: { cc: false, bcc: false, body: 'main' },
		multiple: false
	}
});
```

## Recipient chosen by the reader

To is optional: a link with only a subject lets the reader pick the recipient in their mail app.

``` { .js .jodit-demo }
Jodit.make('#editor', {
	buttons: ['mailto', '|', 'source'],
	mailto: {
		required: { to: false, subject: true }
	}
});
```

## Editing an existing link

The editor starts with an email link. Put the cursor inside it and press the email button: the dialog shows its fields, "Update" saves the changes and "Unlink" removes the link.

``` { .js .jodit-demo }
const editor = Jodit.make('#editor', {
	buttons: ['mailto', '|', 'source']
});

editor.value = '<p>Questions? <a href="mailto:team@example.com?subject=Question">Write to the team</a>.</p>';
```

## Russian interface

``` { .js .jodit-demo }
Jodit.make('#editor', {
	language: 'ru',
	buttons: ['bold', 'italic', '|', 'mailto']
});
```
