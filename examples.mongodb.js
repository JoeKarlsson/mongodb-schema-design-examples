// The examples from "MongoDB Schema Design Best Practices", runnable in mongosh.
// https://www.joekarlsson.com/talks/mongodb-schema-design-best-practices/
//
// Run against any MongoDB (a fresh local one is fine):
//   mongosh "mongodb://localhost:27017" examples.mongodb.js
// It works in a database of its own, schema_design_examples, and resets it each run.

db = db.getSiblingDB('schema_design_examples');
db.dropDatabase();

function check(condition, message) {
	if (!condition) throw new Error(`Check failed: ${message}`);
	print(`ok  ${message}`);
}

// One-to-one: key-value pairs right in the document.
db.users.insertOne({
	_id: ObjectId('64b7e1f0a1b2c3d4e5f60001'),
	name: 'Joe Karlsson',
	company: 'MongoDB',
	x: '@JoeKarlsson1',
	twitch: 'joe_karlsson',
	tiktok: 'joekarlsson',
	website: 'joekarlsson.com',
});
check(db.users.findOne({ name: 'Joe Karlsson' }).website === 'joekarlsson.com', 'one-to-one: one query returns the whole user');

// One-to-few: embed a small array that won't grow much.
db.users.updateOne(
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60001') },
	{
		$set: {
			addresses: [
				{ street: '123 Sesame St', city: 'Anytown', cc: 'USA' },
				{ street: '123 Avenue Q', city: 'New York', cc: 'USA' },
			],
		},
	},
);
check(db.users.findOne({ 'addresses.city': 'New York' }) !== null, 'one-to-few: query on an embedded address');

// One-to-many: the product keeps an array of references to its parts.
db.parts.insertMany([
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60101'), partno: '123-aff-456', name: '#4 grommet', qty: 94, cost: 0.94, price: 3.99 },
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60102'), partno: '123-aff-457', name: '#5 grommet', qty: 12, cost: 1.05, price: 4.49 },
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60103'), partno: '789-xyz-001', name: 'smoke valve', qty: 3, cost: 12.0, price: 29.99 },
]);
db.products.insertOne({
	name: 'left-handed smoke shifter',
	manufacturer: 'Acme Corp',
	catalog_number: '1234',
	parts: [
		ObjectId('64b7e1f0a1b2c3d4e5f60101'),
		ObjectId('64b7e1f0a1b2c3d4e5f60102'),
		ObjectId('64b7e1f0a1b2c3d4e5f60103'),
	],
});
const product = db.products
	.aggregate([
		{ $match: { catalog_number: '1234' } },
		{ $lookup: { from: 'parts', localField: 'parts', foreignField: '_id', as: 'parts' } },
	])
	.toArray()[0];
check(product.parts.length === 3, 'one-to-many: one $lookup brings back all three parts');

// One-to-squillions: each log message stores its host, so no array grows without bound.
db.hosts.insertOne({ _id: ObjectId('64b7e1f0a1b2c3d4e5f60201'), name: 'goofy.example.com', ipaddr: '127.66.66.66' });
db.logmsg.insertMany([
	{ time: ISODate('2014-03-28T09:42:41.382Z'), message: 'cpu is on fire!', host: ObjectId('64b7e1f0a1b2c3d4e5f60201') },
	{ time: ISODate('2014-03-28T09:43:02.010Z'), message: 'cpu is still on fire!', host: ObjectId('64b7e1f0a1b2c3d4e5f60201') },
]);
db.logmsg.createIndex({ host: 1, time: -1 });
const latest = db.logmsg.find({ host: ObjectId('64b7e1f0a1b2c3d4e5f60201') }).sort({ time: -1 }).limit(100).toArray();
check(latest.length === 2 && latest[0].message === 'cpu is still on fire!', "one-to-squillions: a host's newest logs come first, through the index");

// Many-to-many: users keep their tasks, tasks keep their owners.
db.people.insertMany([
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60301'), name: 'Kate Monster', tasks: [ObjectId('64b7e1f0a1b2c3d4e5f60401'), ObjectId('64b7e1f0a1b2c3d4e5f60402')] },
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60302'), name: 'Trekkie Monster', tasks: [ObjectId('64b7e1f0a1b2c3d4e5f60401')] },
]);
db.tasks.insertMany([
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60401'), description: 'Write blog post about MongoDB schema design', due_date: ISODate('2014-04-01'), owners: [ObjectId('64b7e1f0a1b2c3d4e5f60301'), ObjectId('64b7e1f0a1b2c3d4e5f60302')] },
	{ _id: ObjectId('64b7e1f0a1b2c3d4e5f60402'), description: 'Give the schema design talk', due_date: ISODate('2014-04-02'), owners: [ObjectId('64b7e1f0a1b2c3d4e5f60301')] },
]);
const kate = db.people
	.aggregate([
		{ $match: { name: 'Kate Monster' } },
		{ $lookup: { from: 'tasks', localField: 'tasks', foreignField: '_id', as: 'tasks' } },
	])
	.toArray()[0];
const sharedTask = db.tasks
	.aggregate([
		{ $match: { _id: ObjectId('64b7e1f0a1b2c3d4e5f60401') } },
		{ $lookup: { from: 'people', localField: 'owners', foreignField: '_id', as: 'owners' } },
	])
	.toArray()[0];
check(kate.tasks.length === 2 && sharedTask.owners.length === 2, 'many-to-many: look up from either side');

print(`\nAll examples ran on MongoDB ${db.version()}.`);
