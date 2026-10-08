# Types of data

Every type below is a collection of [DummyJSON](https://dummyjson.com/docs). The tables list the placeholders of the Item template; see [Templates](templates.md) for how to use them.

Every Item template can also show:

| Placeholder | Field |
| --- | --- |
| `{{index}}` | Number of the item, from 1 |
| `{{count}}` | Number of generated items |

Before and After show `{{count}}`, and for the order the [totals](#order). A field marked "list" holds several values: without a filter they are shown with commas.

## Posts {#posts}

Short stories with a title, one paragraph of text and tags; 251 records from `/posts`. The closest thing to *lorem ipsum*, but readable.

Layouts: Headings and paragraphs, Paragraphs, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{title}}` | Title |
| `{{body}}` | Text, one paragraph |
| `{{tags}}` | Tags (list) |
| `{{views}}` | Number of views |
| `{{reactions.likes}}` | Number of likes |
| `{{reactions.dislikes}}` | Number of dislikes |

## Quotes {#quotes}

Quotes of famous people; 1454 records from `/quotes`.

Layouts: Quotes, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{quote}}` | Text of the quote |
| `{{author}}` | Author |

## Comments {#comments}

One-sentence comments with their author; 340 records from `/comments`.

Layouts: Comments, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{body}}` | Text, one sentence |
| `{{likes}}` | Number of likes |
| `{{user.fullName}}` | Name of the author |
| `{{user.username}}` | Username of the author |

## To-dos {#todos}

Tasks, done or not; 254 records from `/todos`. `{{check}}` is ☑ or ☐ for a checklist.

Layouts: Checklist, Numbered list.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{todo}}` | Task |
| `{{completed}}` | Done: true or false |
| `{{check}}` | Checkbox: ☑ when done, ☐ when not |

## Users {#users}

People with their contacts, address and job; 208 records from `/users`. `{{fullName}}` is made by the plugin. The private fields of DummyJSON users (password, card and bank details, crypto wallet, IP and MAC addresses, SSN) are never asked for.

Layouts: Table, Cards, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{firstName}}` | First name |
| `{{lastName}}` | Last name |
| `{{fullName}}` | First and last name |
| `{{maidenName}}` | Maiden name |
| `{{age}}` | Age |
| `{{gender}}` | Gender: male or female |
| `{{birthDate}}` | Date of birth, like 1996-5-30 |
| `{{email}}` | Email address |
| `{{phone}}` | Phone number |
| `{{username}}` | Username |
| `{{image}}` | URL of the avatar, 128×128 |
| `{{role}}` | Role: admin, moderator or user |
| `{{university}}` | University |
| `{{bloodGroup}}` | Blood group |
| `{{height}}` | Height, cm |
| `{{weight}}` | Weight, kg |
| `{{eyeColor}}` | Eye colour |
| `{{hair.color}}` | Hair colour |
| `{{hair.type}}` | Hair type |
| `{{address.address}}` | Street address |
| `{{address.city}}` | City |
| `{{address.state}}` | State |
| `{{address.stateCode}}` | State code |
| `{{address.postalCode}}` | Postal code |
| `{{address.country}}` | Country |
| `{{address.coordinates.lat}}` | Latitude |
| `{{address.coordinates.lng}}` | Longitude |
| `{{company.name}}` | Company |
| `{{company.title}}` | Job title |
| `{{company.department}}` | Department |
| `{{company.address.address}}` | Street address of the company |
| `{{company.address.city}}` | City of the company |
| `{{company.address.state}}` | State of the company |
| `{{company.address.stateCode}}` | State code of the company |
| `{{company.address.postalCode}}` | Postal code of the company |
| `{{company.address.country}}` | Country of the company |
| `{{company.address.coordinates.lat}}` | Latitude of the company |
| `{{company.address.coordinates.lng}}` | Longitude of the company |

## Products {#products}

Products of 24 categories; 194 records from `/products`. `{{finalPrice}}` (the price with the discount) and `{{stars}}` are made by the plugin. `brand` is missing in about half of the products: use `{{brand|default:—}}`. The reviews of a product are a list of objects: show one of their fields, like `{{reviews.comment|ul}}`, or use the [Reviews](#reviews) type for a layout of their own.

Layouts: Cards, Cards with reviews, Table, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{title}}` | Name |
| `{{description}}` | Description |
| `{{category}}` | Category |
| `{{brand}}` | Brand; not every product has one |
| `{{price}}` | Price |
| `{{discountPercentage}}` | Discount, % |
| `{{finalPrice}}` | Price with the discount |
| `{{rating}}` | Rating from 0 to 5 |
| `{{stars}}` | Rating as stars: ★★★★☆ |
| `{{stock}}` | Number in stock |
| `{{availabilityStatus}}` | In Stock or Low Stock |
| `{{sku}}` | Stock keeping unit |
| `{{weight}}` | Weight |
| `{{dimensions.width}}` | Width |
| `{{dimensions.height}}` | Height |
| `{{dimensions.depth}}` | Depth |
| `{{warrantyInformation}}` | Warranty |
| `{{shippingInformation}}` | Shipping |
| `{{returnPolicy}}` | Return policy |
| `{{minimumOrderQuantity}}` | Minimum order quantity |
| `{{tags}}` | Tags (list) |
| `{{thumbnail}}` | URL of the small picture |
| `{{images}}` | URLs of the pictures (list) |
| `{{reviews.rating}}` | Ratings of the reviews (list) |
| `{{reviews.comment}}` | Texts of the reviews (list) |
| `{{reviews.date}}` | Dates of the reviews (list) |
| `{{reviews.reviewerName}}` | Names of the reviewers (list) |

## Reviews {#reviews}

The reviews of all products as one collection, with the product they are about; 582 records, made from `/products`. The email of the reviewer is not included.

Layouts: Reviews, Table.

| Placeholder | Field |
| --- | --- |
| `{{rating}}` | Rating from 1 to 5 |
| `{{stars}}` | Rating as stars: ★★★★☆ |
| `{{comment}}` | Text of the review |
| `{{date}}` | Date and time, ISO 8601 |
| `{{reviewerName}}` | Name of the reviewer |
| `{{product.id}}` | Number of the product |
| `{{product.title}}` | Name of the product |
| `{{product.thumbnail}}` | URL of the small picture of the product |

## Recipes {#recipes}

Recipes with ingredients and steps; 50 records from `/recipes`, so no more than 50 at once. `{{ingredients|ul}}` and `{{instructions|ol}}` make the lists.

Layouts: Full recipes, Table, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{name}}` | Name |
| `{{image}}` | URL of the picture |
| `{{ingredients}}` | Ingredients (list) |
| `{{instructions}}` | Steps (list) |
| `{{prepTimeMinutes}}` | Preparation time, minutes |
| `{{cookTimeMinutes}}` | Cooking time, minutes |
| `{{servings}}` | Number of servings |
| `{{difficulty}}` | Easy, Medium or Hard |
| `{{cuisine}}` | Cuisine |
| `{{caloriesPerServing}}` | Calories per serving |
| `{{rating}}` | Rating from 0 to 5 |
| `{{reviewCount}}` | Number of reviews |
| `{{tags}}` | Tags (list) |
| `{{mealType}}` | Meals: Breakfast, Lunch, Dinner… (list) |

## Order {#order}

An order of products: every item is a product with a quantity from 1 to 5, and the plugin counts the totals. Made from `/products`, up to 100 items.

Layouts: Table, List.

| Placeholder | Field |
| --- | --- |
| `{{id}}` | Number of the record in the service |
| `{{title}}` | Name of the product |
| `{{brand}}` | Brand; not every product has one |
| `{{price}}` | Price of one |
| `{{quantity}}` | Quantity, from 1 to 5 |
| `{{total}}` | Price × quantity |
| `{{thumbnail}}` | URL of the small picture |

In Before and After:

| Placeholder | Field |
| --- | --- |
| `{{order.total}}` | Total of the order |
| `{{order.totalQuantity}}` | Number of all products in the order |

## Images {#images}

Placeholder images of the data service, in the size and colours set in the dialog; no request is made for them. With the background `random`, every image gets one of eight calm colours; otherwise give 6 hex digits, like `5b8def`. The text is the size when empty.

Layouts: One per paragraph, In one paragraph.

| Placeholder | Field |
| --- | --- |
| `{{url}}` | URL of the image |
| `{{width}}` | Width, px |
| `{{height}}` | Height, px |
| `{{background}}` | Background colour, like 5b8def |
| `{{color}}` | Text colour, like ffffff |
