#!/usr/bin/env node

var pkg = require('../package.json'),
	program = new (require('commander').Command)(pkg.name);

program
.version(pkg.version)
.description(pkg.description)
.usage('[--min-length 140] [--lang-prefix (none by default)] [--diff] [--user-id 1] [filename.json]')
.option('-m, --min-length <length>', 'Minimal length for READMEs markdowns to be considered as posts', Number)
.option('-p, --lang-prefix <prefix>', '```<prefix>-[lang name] for code blocks to be used (i.e., "lang" for Prism)')
.option('-d, --diff', 'Export only repos that don\'t exist in destination yet')
.option('-u, --user-id <id>', 'Ghost User ID', Number)
.parse(process.argv);

var Promise = require('bluebird'),
	read = require('read'),
	whenRead = function (options) {
		var defer = Promise.defer();
		
		read(options, function (err, input) {
			defer.callback(err, input);
		});
		
		return defer.promise;
	},
	whenUsername = whenRead({prompt: 'Github username: '}),
	whenPassword = whenUsername.then(function () {
		return whenRead({prompt: 'Github password: ', silent: true, replace: '*'});
	}),
	whenFilename = program.args.length ? Promise.resolve(program.args[0]) : whenPassword.then(function () {
		return whenRead({prompt: 'Save to: ', default: 'export.json', edit: true});
	});

Promise.props({
	username: whenUsername,
	password: whenPassword,
	filename: whenFilename,
	minLength: program.minLength,
	langPrefix: program.langPrefix,
	diff: !!program.diff,
	userId: program.userId
})
.then(function (options) {
	console.log('Fetching data...');
	return options;
})
.then(require('..'))
.then(function () {
	console.log('Finished successfully!');
});