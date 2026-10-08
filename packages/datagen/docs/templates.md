# Templates

A template is HTML in three parts:

- **Before**: shown once, before the items;
- **Item**: shown once for every generated item;
- **After**: shown once, after the items.

```html
<!-- Before -->
<ul>
<!-- Item -->
<li><strong>{{title}}</strong> — {{body|words:20}}</li>
<!-- After -->
</ul>
```

With three posts this gives `<ul>` with three `<li>` and `</ul>`. Before and After may be empty: then every item stands on its own, like the "Headings and paragraphs" layout of posts (`<h2>{{title}}</h2><p>{{body}}</p>` for every item).

The built-in layouts are templates too. The "Template" tab of the dialog shows the template of the chosen layout, with the tags, attributes and placeholders in colour; change it, and the layout becomes "Own template". Your own template of each type is remembered: choose a built-in layout to compare, and "Own template" brings yours back.

## Placeholders

A placeholder is a field name in double braces. The list next to the template in the dialog shows the fields of the type with a short description; a click puts the placeholder into the template. [Types of data](types.md) lists them all.

| Placeholder | Shows |
| --- | --- |
| `{{title}}` | A field |
| `{{company.name}}` | A field of a field, at any depth: `{{company.address.city}}` |
| `{{images.0}}` | An item of a list, counted from 0 |
| `{{reviews.comment}}` | The `comment` field of every item of a list of objects, as a list |
| `{{reviews.0.comment}}` | The `comment` field of the first item |
| `{{index}}` | The number of the item, from 1 (Item only) |
| `{{count}}` | The number of generated items (all parts) |

Before and After show the values of the whole set rather than of one item: `{{count}}`, and for the order `{{order.total}}` and `{{order.totalQuantity}}`. The fields of the items are not known there.

Spaces inside the braces are allowed: `{{ title }}` is the same as `{{title}}`.

## Values

- **Values are escaped.** `<`, `>`, `&` and quotes in the data are shown as text, so the data cannot change the HTML of the template, also in attributes: `<img alt="{{title}}">` is safe with any title.
- **A list is shown with commas**: `{{tags}}` gives `beauty, mascara`. Use a filter for other forms.
- **An empty field shows nothing.** Some fields are not in every record: not every product has a `brand`. Use [`default`](#default) to show something else.
- **Numbers and booleans** are shown as they are: `9.99`, `true`. [`fixed`](#fixed) shows a number with the given decimals.

## Filters

A filter changes the value before it is shown. It follows the field after `|`, with its argument after `:`. Filters are applied from left to right:

```text
{{body|words:20}}
{{tags|join: · }}
{{brand|default:—}}
{{body|words:12|default:No text}}
```

| Filter | Does | Example | Result |
| --- | --- | --- | --- |
| `ul` | A bulleted list of the items | `{{tags|ul}}` | `<ul><li>beauty</li><li>mascara</li></ul>` |
| `ol` | A numbered list of the items | `{{instructions|ol}}` | `<ol><li>Preheat…</li><li>Bake…</li></ol>` |
| `first` | The first item of a list | `{{images|first}}` | `https://…/1.webp` |
| `join` | The items joined with the argument | `{{tags|join: · }}` | `beauty · mascara` |
| `count` | The number of items | `{{reviews.comment|count}}` | `3` |
| `words` | The first words of the text | `{{body|words:5}}` | `His mother had always taught…` |
| `fixed` | A number with the given decimals | `{{price|fixed:2}}` | `120.00` |
| `default` | The argument instead of an empty value | `{{brand|default:—}}` | `—` |

### ul, ol

Make a list of the items, each one escaped. A single value gives a list of one item; an empty list gives nothing. These filters make HTML, so they must be the last ones: `{{tags|default:none|ul}}` works, `{{tags|ul|first}}` is a problem.

### first

The first item of a list; any other value stays as it is. `{{images|first}}` is the same as `{{images.0}}`.

### join

Joins the items of a list with the argument, taken as it is written, spaces included: `{{tags|join: / }}` gives `beauty / mascara`. Without the argument the separator is a comma and a space.

### count

The number of items of a list: `{{tags|count}}`, `{{reviews.comment|count}}`. A single value counts as 1, an empty one as 0.

### words

The first words of a text, with `…` when the text has more. The argument is a whole number from 1 to 1000. Applied to a list, it cuts every item.

### fixed

A number with the given number of decimals, from 0 to 10; 2 without the argument. Text that is not a number stays as it is.

### default

The argument instead of an empty value: a field the record does not have, an empty text, or an empty list. `0` and `false` are not empty.

## Problems

The dialog checks the template while you type: the problems are underlined in the template and listed under the tabs. A click on a problem in the list selects its placeholder.

| Problem | Example | Insert |
| --- | --- | --- |
| Unknown field | `{{titel}}`; `{{index}}` in Before | Blocked |
| A field that has fields | `{{reviews}}`, `{{dimensions}}`: choose one of their fields | Blocked |
| Not a field name | `{{a b}}` | Blocked |
| Not closed | `{{title` | Blocked |
| Unknown filter | `{{tags|lu}}` | Blocked |
| Wrong argument | `{{body|words}}`, `{{price|fixed:20}}`, `{{tags|ul:x}}` | Blocked |
| Filter not last | `{{tags|ul|first}}` | Blocked |
| Tag not closed | `<ul>` without `</ul>` | Warning |
| Tag that closes nothing | `</tabel>` | Warning |

The tags are checked in the whole template, Before, Item and After together, so `<table>` in Before and `</table>` in After are fine. A problem with the tags is only a warning: the browser completes such HTML anyway, but maybe not the way you meant, so check the preview. End tags that HTML allows to leave out, like `</li>`, `</p>` and `</td>`, are not required.

## What happens on insertion

The preview shows the result in an isolated frame: scripts and event handlers of the template do not run there.

On insertion the editor cleans the HTML as it cleans any inserted content, with its `cleanHTML` settings: event handlers like `onclick` are removed, `javascript:` links are made harmless, and the `sanitizer` of your site, if there is one, is applied.

Content with blocks (paragraphs, headings, lists, tables, quotes) goes in place of the empty paragraph of the caret, or after the block of the caret, followed by an empty paragraph to go on typing. A template of text and inline elements, like `, <b>{{firstName}}</b>`, goes right to the caret.

## Ready templates

More templates with live editors are on the [Examples](examples.md) page.

A product card with the texts of its reviews:

```html
<!-- Item -->
<h3>{{title}}</h3>
<p><img src="{{thumbnail}}" alt="{{title}}" width="150"></p>
<p><strong>${{finalPrice|fixed:2}}</strong> <s>${{price|fixed:2}}</s> · {{stars}} ({{reviews.comment|count}} reviews)</p>
{{reviews.comment|ul}}
```

A table of people with avatars:

```html
<!-- Before -->
<table><thead><tr><th></th><th>Name</th><th>Job</th><th>City</th></tr></thead><tbody>
<!-- Item -->
<tr><td><img src="{{image}}" alt="" width="32" height="32"></td><td>{{fullName}}<br>{{email}}</td><td>{{company.title}}, {{company.name}}</td><td>{{address.city}}</td></tr>
<!-- After -->
</tbody></table>
```

A numbered list of recipes with their tags:

```html
<!-- Before -->
<ol>
<!-- Item -->
<li><strong>{{name}}</strong> — {{cuisine}}, {{prepTimeMinutes}} + {{cookTimeMinutes}} min<br><small>{{tags|join: · }}</small></li>
<!-- After -->
</ol>
<p>{{count}} recipes</p>
```
