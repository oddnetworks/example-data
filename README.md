# @oddnetworks/oddworks-example-data

[![slack.oddnetworks.com](http://slack.oddnetworks.com/badge.svg)](http://slack.oddnetworks.com)

Example seed functions that help populate our example applications with data.

## Installation

		$ npm install --save @oddnetworks/oddworks-example-data

## Usage

Require the example data package in your script

		const exampleData = require('@oddnetworks/oddworks-example-data');

The any of the available functions on the module (`exampleData`) will be functions that take an [oddcast](https://github.com/oddnetworks/oddcast) bus, like so:

		const oddcast = require('oddcast');
		const bus = oddcast.bus();

		exampleData.nasa(bus);

These functions return promises.

In reality, these functions can do whatever you like. We use them to send messages on the oddcast bus so that our example data is sent to any observing "stores". Read more about stores in [oddworks](https://github.com/oddnetworks/oddworks)

### Seed Script

In the __nasa__ example, we're loading all the relative JSON files, which each contain a single object, and sending them into our stores.

```js

// note: this function returns a promise
module.exports = bus => {

	// first get an array of all the paths for channels and platforms
	return glob('./+(channel|platform)/*.json', {cwd: __dirname})

		// next, load all the "channel" and "platform" objects
		.then(loadFiles)

		// next, ensure each of those objects are sent to our store(s)
		.then(objects => {
			//...
			// Here we send all objects to the "seedData" method,
			// which will create an array of promises
			// we'll wrap that in Promise.all, to ensure they all run
			// before continuing
			return Promise.all(seedData(bus, objects));
		})

		// next we'll get an array of all the paths for collections,
		// promotions, videos, and views
		.then(() => {
			return glob('./+(collection|promotion|video|view)/*.json', {cwd: __dirname});
		})

		// then load all the "collection", "promotion", "video" and "view" objects
		.then(loadFiles)

		// finally, we'll ensure all of the objects are sent to our store(e)
		.then(objects => {
			// ...
			return Promise.all(seedData(bus, objects))
		});
};
```

In a nutshell, we're loading all of the `channel` and `platform` JSON objects first, then we're loading all the `collection`, `promotion`, `video`, and `view` JSON objects.

Let's break down the `seedData` method:

```js
function seedData(bus, objects) {
	// bus is your oddcast bus
	// objects is an array of the objects defined within each JSON file

	// we are going to return an array of promises
	const promises = [];

	// we need to iterate over all the objects and create promises for each
	for(let object of objects) {

		// the searchable variable is set to true if the object.type is one of the searchableTypes
		const searchable = Boolean(searchableTypes.indexOf(object.type) + 1);

		// by default, we use the following pattern:
		let pattern = {role: 'store', cmd: 'set', type: object.type};
		// be sure that your oddcast bus has an observer for this command pattern

		if (searchable) {
			// searchable objects have a different pattern
			pattern = {role: 'catalog', cmd: 'create', searchable: true};
			// be sure that your oddcast bus has an observer for this command pattern
		}

		const payload = {
			version: 1,
			channel: object.channel,
			platform: object.id,
			scope: ['platform']
		};

		// ... console logging omitted - these are convenience methods

		// next, send the command on your oddcast bus
		// sendCommand returns a promise, so we push that to our promises array
		promises.push(bus.sendCommand(pattern, object));
	}

	// finally, return our stored object promises
	return promises;
}
```

## Contributing

Feel free to contribute and create additional sample data/seeds. Please make sure any data is in the public domain.
