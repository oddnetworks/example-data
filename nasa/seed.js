'use strict';

const path = require('path');
const Promise = require('bluebird');
const glob = Promise.promisifyAll(require('glob')).GlobAsync;
const searchableTypes = ['collection', 'video'];

function loadFiles(files) {
	const objects = [];
	for(let file of files) {
		objects.push(require(path.join(__dirname, file))); // eslint-disable-line
	}
	return objects;
}

function seedData(bus, objects) {
	const promises = [];

	for(let object of objects) {
		const searchable = Boolean(searchableTypes.indexOf(object.type) + 1);
		let pattern = {role: 'store', cmd: 'set', type: object.type};
		if (searchable) {
			pattern = {role: 'catalog', cmd: 'create', searchable: true};
		}

		promises.push(bus.sendCommand(pattern, object));
	}

	return promises;
}

module.exports = (bus) => {
	const loaded = [];
	return glob('./+(channel|platform)/*.json', {cwd: __dirname})
		.then(loadFiles)
		.then(resources => {
			resources.forEach(resource => {
				loaded.push(resource);
			});
			return Promise.all(seedData(bus, resources));
		})
		.then(() => {
			return glob('./+(collection|promotion|video|view)/*.json', {cwd: __dirname});
		})
		.then(loadFiles)
		.then(resources => {
			resources.forEach(resource => {
				loaded.push(resource);
			});
			return Promise.all(seedData(bus, resources))
		})
		.then(() => {
			return Promise.resolve(loaded)
		});
};
