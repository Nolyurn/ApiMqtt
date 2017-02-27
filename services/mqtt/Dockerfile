FROM node

RUN apt-get -qq update && apt-get -qq install libzmq3 libzmq3-dev

COPY server /home/node/server
RUN chown node:node /home/node -R

RUN npm install --silent -g webpack

USER node
WORKDIR /home/node/server
RUN npm install --silent

RUN npm run build

CMD [ "npm", "start" ]
