FROM node:latest

RUN mkdir parse

ADD . /parse
WORKDIR /parse

RUN yarn install
RUN npm install pm2 -g
RUN yarn start-production

EXPOSE 1337
VOLUME /parse/cloud               

CMD [ "pm2", "logs" ]
