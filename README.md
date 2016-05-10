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

### NASA seed script explained

In the __nasa__ example, we're loading all the relative JSON files, which each contain a single object, and sending them into our stores.

```js
module.exports = bus => {
	// first get an array of all the paths for channels and platforms
	return glob('./+(channel|platform)/*.json', {cwd: __dirname})
		// then load all the "channel" and "platform" objects
		.then(loadFiles)
		.then(objects => {
			//...
			// next, send all of those objects to the "seedData" method,
			// which will create an array of promises
			return Promise.all(seedData(bus, objects));
		})
		.then(() => {
			// once all the channels and platforms are loaded into our store(s),
			// get an array of all the paths for collections, promotions, videos, and views
			return glob('./+(collection|promotion|video|view)/*.json', {cwd: __dirname});
		})
		// then load all the "collection", "promotion", "video" and "view" objects
		.then(loadFiles)
		.then(objects => {
			// ...
			// finally, seed our store(s) with the collections, promotions, videos, and views
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

	// we need to map over all the objects and create promises for each
	return _.map(objects, object => {
		// the searchable variable is set to true if the object.type is one of the searchableTypes
		const searchable = Boolean(_.indexOf(searchableTypes, object.type) + 1);
		
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
	
		// finally, send the command on your oddcast bus
		return bus.sendCommand(pattern, object);
		// this will return a promise
	});
}
```

## Contributing

Feel free to contribute and create additional sample data/seeds. Please make sure any data is in the public domain.
