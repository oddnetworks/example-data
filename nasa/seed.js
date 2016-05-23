'use strict';

const path = require('path');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const glob = Promise.promisifyAll(require('glob')).GlobAsync;
const searchableTypes = ['collection', 'video'];

const jwtSecret = process.env.JWT_SECRET || 'secret';

function loadFiles(files) {
	const objects = [];
	for(let file of files) {
		objects.push(require(path.join(__dirname, file))); // eslint-disable-line
	}
	return objects;
}

function seedData(bus, objects, logger) {
	const promises = [];

	for(let object of objects) {
		const searchable = Boolean(searchableTypes.indexOf(object.type) + 1);
		let pattern = {role: 'store', cmd: 'set', type: object.type};
		if (searchable) {
			pattern = {role: 'catalog', cmd: 'create', searchable: true};
		}

		const payload = {
			version: 1,
			channel: object.channel,
			platform: object.id,
			scope: ['platform']
		};

		const token = jwt.sign(payload, jwtSecret);
		log(logger, `${object.type}: ${object.id}`);
		if (object.type === 'platform') {
			log(logger, `     JWT: ${token}`);
		}

		promises.push(bus.sendCommand(pattern, object));
	}

	return promises;
}

function log(logger, msg) {
	if (logger) {
		logger.debug(msg);
	}
}

module.exports = (bus, logger) => {
	return glob('./+(channel|platform)/*.json', {cwd: __dirname})
		.then(loadFiles)
		.then(objects => {
			log(logger, `Loading test Channel and Platforms...`);
			log(logger, `-------------------------------------`);
			return Promise.all(seedData(bus, objects, logger));
		})
		.then(() => {
			return glob('./+(collection|promotion|video|view)/*.json', {cwd: __dirname});
		})
		.then(loadFiles)
		.then(objects => {
			log(logger, `Loading test Resources...`);
			log(logger, `-------------------------`);
			return Promise.all(seedData(bus, objects, logger))
		});
};
