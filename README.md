# Avalon.ist Development Server

This repository hosts the development build of **Avalon.ist: The Resistance: Avalon online.**

The Resistance: Avalon is a social deduction game created by Don Eskridge.
Based on Arthurian legend, the loyal servants of Arthur work together to find the members of the Resistance while protecting the identity of Merlin. The minions of Mordred attempt to sneak onto the Resistance team in order to deduce the identity of Merlin and assassinate him. Will the minions of Mordred kill Merlin, or will the loyal servants triumph over evil?

Production build is running at https://avalon.ist/

Project constructed using the [parse-server](https://github.com/ParsePlatform/parse-server) module on Express.
Read the full Parse Server guide here: https://github.com/ParsePlatform/parse-server/wiki/Parse-Server-Guide

### For Local Development

* Make sure your node version corresponds with the project. `node --version`
* Make sure you have yarn installed at https://classic.yarnpkg.com/en/docs/install/
* Clone this repo to your computer.
* Run `yarn install` in the current directory. You should run this in any case of dependency differences with the master branch.
* Install mongo locally using https://docs.mongodb.com/master/administration/install-community/
* Make sure mongo is running on your computer before starting the server.
* Run the server with: `yarn start`
* You now have a database named "dev" that contains your Parse data.

### Use of The Parse Dashboard

The Parse Dashboard is a technology developed by Parse, which allows you to make easy interactions with the database. The next steps will allow you to use the technology with this project.

* Run `npm install -g parse-dashboard` to install the dashboard.
* Run `parse-dashboard --dev --appId AVALONIST --masterKey avalonist_key --serverURL "http://localhost:1337/parse" --appName Avalon.ist` every time you want to have access to the dashboard.
* Navigate to `localhost:4040`

### Contributing

This project is an open source project, you can contribute in anyway possible. This project uses Prettier and ESLint. Make sure to Prettify and Lint every file contributed.
