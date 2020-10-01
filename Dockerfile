FROM node:latest

RUN mkdir parse

ADD . /parse
WORKDIR /parse

RUN yarn install

EXPOSE 1337
VOLUME /parse/cloud               

CMD [ "yarn", "start-server" ]
