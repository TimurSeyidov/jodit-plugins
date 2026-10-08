/** A value of generated data: what the template placeholders read */
export type DatagenValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| DatagenValue[]
	| DatagenRecord;

/** A record of generated data */
export interface DatagenRecord {
	[key: string]: DatagenValue;
}

/** A field that the templates can show as `{{path}}` */
export interface DatagenField {
	/** Path of the field, nested names joined with dots */
	path: string;

	/** What the field holds, in English: the plugin shows it in the list of placeholders */
	description: string;

	/** The field holds a list: a list of strings, or a field of a list of objects */
	list?: boolean;
}

/** A built-in type of data */
export type DatagenTypeName =
	| 'posts'
	| 'quotes'
	| 'comments'
	| 'todos'
	| 'users'
	| 'products'
	| 'reviews'
	| 'recipes'
	| 'order'
	| 'images';

/** Generated data: the records shown by the Item template and the values shown by Before and After */
export interface DatagenData {
	items: DatagenRecord[];
	context: DatagenRecord;
}

/** A collection of the data service and how its records become the records of a type */
export interface DatagenCollection {
	/** Name of the collection in the URL and in the answer */
	resource: string;

	/** Fields asked from the service; nothing else comes into the editor */
	select: string[];

	/** Records of the type made from one record of the collection */
	toItems?: (record: DatagenRecord) => DatagenRecord[];
}

/** A type of data */
export interface DatagenType {
	/** Name in the list of types, in English */
	title: string;

	/** What the records are, in English: the dialog shows it under the choice of the type */
	description: string;

	/** Fields of the Item template */
	fields: DatagenField[];

	/** Fields of the Before and After templates, besides `count` */
	context?: DatagenField[];

	/** Where the records come from; a type without a collection makes its records itself */
	collection?: DatagenCollection;

	/** Completes the chosen records: values that depend on the choice and the values of `context` */
	finish?: (items: DatagenRecord[], random: () => number) => DatagenData;
}

/** Fields that every template can show */
export const COMMON_FIELDS: DatagenField[] = [
	{ path: 'count', description: 'Number of generated items' }
];

/** Fields that every Item template can show */
export const ITEM_FIELDS: DatagenField[] = [
	{ path: 'index', description: 'Number of the item, from 1' },
	...COMMON_FIELDS
];

const num = (value: DatagenValue): number => (typeof value === 'number' ? value : 0);

const round = (value: number): number => Math.round(value * 100) / 100;

/** Five stars with the rounded `rating` filled: ★★★☆☆ */
export function stars(rating: DatagenValue): string {
	const full = Math.max(0, Math.min(5, Math.round(num(rating))));
	return '★'.repeat(full) + '☆'.repeat(5 - full);
}

const id: DatagenField = { path: 'id', description: 'Number of the record in the service' };

export const TYPES: Record<DatagenTypeName, DatagenType> = {
	posts: {
		title: 'Posts',
		description: 'Short stories with a title, one paragraph of text, tags and reactions.',
		collection: {
			resource: 'posts',
			select: ['title', 'body', 'tags', 'reactions', 'views']
		},
		fields: [
			id,
			{ path: 'title', description: 'Title' },
			{ path: 'body', description: 'Text, one paragraph' },
			{ path: 'tags', description: 'Tags', list: true },
			{ path: 'views', description: 'Number of views' },
			{ path: 'reactions.likes', description: 'Number of likes' },
			{ path: 'reactions.dislikes', description: 'Number of dislikes' }
		]
	},

	quotes: {
		title: 'Quotes',
		description: 'Quotes of famous people with their authors.',
		collection: { resource: 'quotes', select: ['quote', 'author'] },
		fields: [
			id,
			{ path: 'quote', description: 'Text of the quote' },
			{ path: 'author', description: 'Author' }
		]
	},

	comments: {
		title: 'Comments',
		description: 'One-sentence comments with the name of the author and the likes.',
		collection: { resource: 'comments', select: ['body', 'likes', 'user'] },
		fields: [
			id,
			{ path: 'body', description: 'Text, one sentence' },
			{ path: 'likes', description: 'Number of likes' },
			{ path: 'user.fullName', description: 'Name of the author' },
			{ path: 'user.username', description: 'Username of the author' }
		]
	},

	todos: {
		title: 'To-dos',
		description: 'Tasks that are done or not, for lists and checklists.',
		collection: {
			resource: 'todos',
			select: ['todo', 'completed'],
			toItems: record => [{ ...record, check: record.completed ? '☑' : '☐' }]
		},
		fields: [
			id,
			{ path: 'todo', description: 'Task' },
			{ path: 'completed', description: 'Done: true or false' },
			{ path: 'check', description: 'Checkbox: ☑ when done, ☐ when not' }
		]
	},

	users: {
		title: 'Users',
		description: 'People: name, age, email, phone, avatar, address, company and job. No private data is asked for.',
		collection: {
			resource: 'users',
			select: [
				'firstName',
				'lastName',
				'maidenName',
				'age',
				'gender',
				'email',
				'phone',
				'username',
				'birthDate',
				'image',
				'bloodGroup',
				'height',
				'weight',
				'eyeColor',
				'hair',
				'address',
				'university',
				'company',
				'role'
			],
			toItems: record => [
				{ ...record, fullName: `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() }
			]
		},
		fields: [
			id,
			{ path: 'firstName', description: 'First name' },
			{ path: 'lastName', description: 'Last name' },
			{ path: 'fullName', description: 'First and last name' },
			{ path: 'maidenName', description: 'Maiden name' },
			{ path: 'age', description: 'Age' },
			{ path: 'gender', description: 'Gender: male or female' },
			{ path: 'birthDate', description: 'Date of birth, like 1996-5-30' },
			{ path: 'email', description: 'Email address' },
			{ path: 'phone', description: 'Phone number' },
			{ path: 'username', description: 'Username' },
			{ path: 'image', description: 'URL of the avatar, 128×128' },
			{ path: 'role', description: 'Role: admin, moderator or user' },
			{ path: 'university', description: 'University' },
			{ path: 'bloodGroup', description: 'Blood group' },
			{ path: 'height', description: 'Height, cm' },
			{ path: 'weight', description: 'Weight, kg' },
			{ path: 'eyeColor', description: 'Eye colour' },
			{ path: 'hair.color', description: 'Hair colour' },
			{ path: 'hair.type', description: 'Hair type' },
			{ path: 'address.address', description: 'Street address' },
			{ path: 'address.city', description: 'City' },
			{ path: 'address.state', description: 'State' },
			{ path: 'address.stateCode', description: 'State code' },
			{ path: 'address.postalCode', description: 'Postal code' },
			{ path: 'address.country', description: 'Country' },
			{ path: 'address.coordinates.lat', description: 'Latitude' },
			{ path: 'address.coordinates.lng', description: 'Longitude' },
			{ path: 'company.name', description: 'Company' },
			{ path: 'company.title', description: 'Job title' },
			{ path: 'company.department', description: 'Department' },
			{ path: 'company.address.address', description: 'Street address of the company' },
			{ path: 'company.address.city', description: 'City of the company' },
			{ path: 'company.address.state', description: 'State of the company' },
			{ path: 'company.address.stateCode', description: 'State code of the company' },
			{ path: 'company.address.postalCode', description: 'Postal code of the company' },
			{ path: 'company.address.country', description: 'Country of the company' },
			{ path: 'company.address.coordinates.lat', description: 'Latitude of the company' },
			{ path: 'company.address.coordinates.lng', description: 'Longitude of the company' }
		]
	},

	products: {
		title: 'Products',
		description: 'Products with a description, price, discount, rating, brand, pictures and reviews. The pictures are links to cdn.dummyjson.com.',
		collection: {
			resource: 'products',
			select: [
				'title',
				'description',
				'category',
				'brand',
				'price',
				'discountPercentage',
				'rating',
				'stock',
				'availabilityStatus',
				'sku',
				'weight',
				'dimensions',
				'warrantyInformation',
				'shippingInformation',
				'returnPolicy',
				'minimumOrderQuantity',
				'tags',
				'images',
				'thumbnail',
				'reviews'
			],
			toItems: record => [
				{
					...record,
					finalPrice: round(num(record.price) * (1 - num(record.discountPercentage) / 100)),
					stars: stars(record.rating)
				}
			]
		},
		fields: [
			id,
			{ path: 'title', description: 'Name' },
			{ path: 'description', description: 'Description' },
			{ path: 'category', description: 'Category' },
			{ path: 'brand', description: 'Brand; not every product has one' },
			{ path: 'price', description: 'Price' },
			{ path: 'discountPercentage', description: 'Discount, %' },
			{ path: 'finalPrice', description: 'Price with the discount' },
			{ path: 'rating', description: 'Rating from 0 to 5' },
			{ path: 'stars', description: 'Rating as stars: ★★★★☆' },
			{ path: 'stock', description: 'Number in stock' },
			{ path: 'availabilityStatus', description: 'In Stock or Low Stock' },
			{ path: 'sku', description: 'Stock keeping unit' },
			{ path: 'weight', description: 'Weight' },
			{ path: 'dimensions.width', description: 'Width' },
			{ path: 'dimensions.height', description: 'Height' },
			{ path: 'dimensions.depth', description: 'Depth' },
			{ path: 'warrantyInformation', description: 'Warranty' },
			{ path: 'shippingInformation', description: 'Shipping' },
			{ path: 'returnPolicy', description: 'Return policy' },
			{ path: 'minimumOrderQuantity', description: 'Minimum order quantity' },
			{ path: 'tags', description: 'Tags', list: true },
			{ path: 'thumbnail', description: 'URL of the small picture' },
			{ path: 'images', description: 'URLs of the pictures', list: true },
			{ path: 'reviews.rating', description: 'Ratings of the reviews', list: true },
			{ path: 'reviews.comment', description: 'Texts of the reviews', list: true },
			{ path: 'reviews.date', description: 'Dates of the reviews', list: true },
			{ path: 'reviews.reviewerName', description: 'Names of the reviewers', list: true }
		]
	},

	reviews: {
		title: 'Reviews',
		description: 'Reviews of the products: rating, text, the name of the reviewer and the product.',
		collection: {
			resource: 'products',
			select: ['title', 'thumbnail', 'reviews'],
			toItems: record =>
				(Array.isArray(record.reviews) ? record.reviews : []).map(review => {
					const { reviewerEmail, ...rest } = review as DatagenRecord;

					return {
						...rest,
						stars: stars(rest.rating),
						product: { id: record.id, title: record.title, thumbnail: record.thumbnail }
					};
				})
		},
		fields: [
			{ path: 'rating', description: 'Rating from 1 to 5' },
			{ path: 'stars', description: 'Rating as stars: ★★★★☆' },
			{ path: 'comment', description: 'Text of the review' },
			{ path: 'date', description: 'Date and time, ISO 8601' },
			{ path: 'reviewerName', description: 'Name of the reviewer' },
			{ path: 'product.id', description: 'Number of the product' },
			{ path: 'product.title', description: 'Name of the product' },
			{ path: 'product.thumbnail', description: 'URL of the small picture of the product' }
		]
	},

	recipes: {
		title: 'Recipes',
		description: 'Recipes with a picture, ingredients, steps, time, servings and calories. There are 50 of them.',
		collection: {
			resource: 'recipes',
			select: [
				'name',
				'image',
				'ingredients',
				'instructions',
				'prepTimeMinutes',
				'cookTimeMinutes',
				'servings',
				'difficulty',
				'cuisine',
				'caloriesPerServing',
				'rating',
				'reviewCount',
				'tags',
				'mealType'
			]
		},
		fields: [
			id,
			{ path: 'name', description: 'Name' },
			{ path: 'image', description: 'URL of the picture' },
			{ path: 'ingredients', description: 'Ingredients', list: true },
			{ path: 'instructions', description: 'Steps', list: true },
			{ path: 'prepTimeMinutes', description: 'Preparation time, minutes' },
			{ path: 'cookTimeMinutes', description: 'Cooking time, minutes' },
			{ path: 'servings', description: 'Number of servings' },
			{ path: 'difficulty', description: 'Easy, Medium or Hard' },
			{ path: 'cuisine', description: 'Cuisine' },
			{ path: 'caloriesPerServing', description: 'Calories per serving' },
			{ path: 'rating', description: 'Rating from 0 to 5' },
			{ path: 'reviewCount', description: 'Number of reviews' },
			{ path: 'tags', description: 'Tags', list: true },
			{ path: 'mealType', description: 'Meals: Breakfast, Lunch, Dinner…', list: true }
		]
	},

	order: {
		title: 'Order',
		description: 'An order of random products, each with a quantity from 1 to 5, and its totals: for an invoice or a receipt.',
		collection: {
			resource: 'products',
			select: ['title', 'brand', 'price', 'thumbnail']
		},
		finish: (items, random) => {
			const lines = items.map(item => {
				const quantity = 1 + Math.floor(random() * 5);
				return { ...item, quantity, total: round(num(item.price) * quantity) };
			});

			return {
				items: lines,
				context: {
					order: {
						total: round(lines.reduce((sum, line) => sum + line.total, 0)),
						totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0)
					}
				}
			};
		},
		fields: [
			id,
			{ path: 'title', description: 'Name of the product' },
			{ path: 'brand', description: 'Brand; not every product has one' },
			{ path: 'price', description: 'Price of one' },
			{ path: 'quantity', description: 'Quantity, from 1 to 5' },
			{ path: 'total', description: 'Price × quantity' },
			{ path: 'thumbnail', description: 'URL of the small picture' }
		],
		context: [
			{ path: 'order.total', description: 'Total of the order' },
			{ path: 'order.totalQuantity', description: 'Number of all products in the order' }
		]
	},

	images: {
		title: 'Images',
		description: 'Placeholder images of the size, colours and text you set, as links to the data service.',
		fields: [
			{ path: 'url', description: 'URL of the image' },
			{ path: 'width', description: 'Width, px' },
			{ path: 'height', description: 'Height, px' },
			{ path: 'background', description: 'Background colour, like 5b8def' },
			{ path: 'color', description: 'Text colour, like ffffff' }
		]
	}
};
