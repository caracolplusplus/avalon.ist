const fs = require('fs');

const initialArticles = [
	{
		id: 'privacy',
		timestamp: Date.now(),
		author: 'Oken',
		title: 'Avalon.ist\'s Privacy Policy',
		content: fs.readFileSync(__dirname + '/articles/privacy.md').toString(),
	},
	{
		id: 'terms-of-use',
		timestamp: Date.now(),
		author: 'Oken',
		title: 'Avalon.ist\'s Terms of Use',
		content: fs.readFileSync(__dirname + '/articles/terms-of-use.md').toString(),
	},
	{
		id: 'development',
		timestamp: Date.now(),
		author: 'Oken',
		title: 'How Do I Contribute to Avalon.ist?',
		content: fs.readFileSync(__dirname + '/articles/development.md').toString(),
	},
	{
		id: 'community',
		timestamp: Date.now(),
		author: 'Oken',
		title: 'Join the Avalon.ist Community!',
		content: fs.readFileSync(__dirname + '/articles/community.md').toString(),
	},
	{
		id: 'start-here',
		timestamp: Date.now(),
		author: 'Oken',
		title: 'Welcome to Avalon.ist — 2020 Newcomers Guide',
		content: fs.readFileSync(__dirname + '/articles/start-here.md').toString(),
	},
];

module.exports = initialArticles;
