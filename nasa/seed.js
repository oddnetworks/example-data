'use strict';

const path = require('path');
const Promise = require('bluebird');
let glob = require('glob');

glob = Promise.promisifyAll(glob).GlobAsync;

const searchableTypes = ['collection', 'video'];

function loadFiles(files) {
	const objects = [];
	for (let file of files) {
		objects.push(require(path.join(__dirname, file))); // eslint-disable-line
	}
	return objects;
}

function seedData(bus, objects) {
	const promises = [];

	for (let object of objects) {
		const searchable = Boolean(searchableTypes.indexOf(object.type) + 1);
		promises.push(bus.sendCommand({role: 'store', cmd: 'set', type: object.type}, object));
		if (searchable) {
			promises.push(bus.sendCommand({role: 'store', cmd: 'index', type: object.type}, object));
		}
	}

	return promises;
}

module.exports = bus => {
	const loaded = [];
	return glob('./+(channel|platform|user)/*.json', {cwd: __dirname})
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
			return Promise.all(seedData(bus, resources));
		})
		.then(() => {
			return Promise.resolve(loaded);
		});
};
