# Avalonist Development Server

This repository hosts the development build of **Avalon.ist:** The Resistance: Avalon online. 

The Resistance: Avalon is a social deduction game created by Don Eskridge.
Based on Arthurian legend, the loyal servants of Arthur work together to find the members of the Resistance while protecting the identity of Merlin. The minions of Mordred attempt to sneak onto the Resistance team in order to deduce the identity of Merlin and assassinate him. Will the minions of Mordred kill Merlin, or will the loyal servants triumph over evil?

Project constructed using the [parse-server](https://github.com/ParsePlatform/parse-server) module on Express.
Read the full Parse Server guide here: https://github.com/ParsePlatform/parse-server/wiki/Parse-Server-Guide

### For Local Development

* Make sure you have at least Node 4.3. `node --version`
* Make sure you have yarn installed https://classic.yarnpkg.com/en/docs/install/
* Clone this repo to your computer.
* Run `yarn install` in the current directory.
* Install mongo locally using http://docs.mongodb.org/master/tutorial/install-mongodb-on-os-x/
* Run `mongo` to connect to your database, just to make sure it's working. Once you see a mongo prompt, exit with Control-D
* Run the server with: `yarn start`
* By default it will use a path of /parse for the API routes.  To change this, or use older client SDKs, run `export PARSE_MOUNT=/1` before launching the server.
* You now have a database named "dev" that contains your Parse data.

### Contributing

This project is an open source project, you can contribute in anyway possible. This project uses Prettier and ESLint. Make sure to Prettify and Lint every file contributed.
