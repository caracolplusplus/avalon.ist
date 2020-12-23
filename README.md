# Avalon.ist Development Server

This repository hosts the development build of **Avalon.ist: The Resistance: Avalon online.**

The Resistance: Avalon is a social deduction game created by Don Eskridge.
The game is free to play using this platform, and always will be.

Production build is running at https://avalon.ist/

Project built using [parse-server](https://github.com/ParsePlatform/parse-server) on Express.
[Read parse-server guide.](https://github.com/ParsePlatform/parse-server/wiki/Parse-Server-Guide)

### For Local Development

Pre-install Dependencies
* Install NodeJS. Make sure version is better than 4.3. `node --version`
* [Install Yarn.](https://classic.yarnpkg.com/en/docs/install/)
* [Install MongoDB.](https://docs.mongodb.com/master/administration/install-community/)

Install project
* Clone repository on your computer.
* Install dependencies. `yarn install`
* Solve dependency differences with branch by installing again.

Start the server
* Start Mongo.
* Start the server. `yarn start`

### Use of Parse Dashboard

Parse Dashboard is useful to interact with your local database.

* Install the dashboard. `npm install -g parse-dashboard`
* Start the dashboard. `parse-dashboard --dev --appId AVALONIST --masterKey avalonist_key --serverURL "http://localhost:1337/parse" --appName Avalon.ist`
* Navigate to `localhost:4040`

### Contributing

This project is an open source project.
The development team reserves the right to decide on which contributions get accepted.

This project uses Prettier and ESLint. It is recommended that you prettify and lint every file 
